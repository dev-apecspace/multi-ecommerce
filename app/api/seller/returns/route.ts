import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const formatReturnRecords = (records: any[] | null | undefined) => {
  if (!records) return []

  return records.map((record) => {
    if (!record?.Product) {
      return record
    }

    const mediaItems = Array.isArray(record.Product.media) ? record.Product.media : []
    const productImages = mediaItems
      .map((item: any, index: number) => {
        const imageUrl = item?.url || item?.imageUrl || item?.image
        if (!imageUrl) return null

        return {
          imageUrl,
          type: item?.type || 'image',
          isMain: item?.isMain || false,
          order: item?.order ?? index,
        }
      })
      .filter((img) => Boolean(img))

    const variantImage = record.ProductVariant?.image

    if ((!productImages || productImages.length === 0) && variantImage) {
      productImages.push({
        imageUrl: variantImage,
        type: 'image',
        isMain: true,
        order: 0,
      })
    }

    const productImageData = productImages.length ? productImages : null

    return {
      ...record,
      Product: {
        ...record.Product,
        ProductImage: productImageData,
      },
      ProductImage: productImageData,
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('[SELLER RETURNS API] GET request with vendorId:', vendorId, 'status:', status)

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 })
    }

    let query = supabase
      .from('Return')
      .select(`
        id,
        orderId,
        orderItemId,
        userId,
        productId,
        variantId,
        reason,
        description,
        returnType,
        exchangeVariantId,
        images,
        refundAmount,
        quantity,
        status,
        sellerNotes,
        requestedAt,
        approvedAt,
        shippedAt,
        completedAt,
        trackingNumber,
        trackingUrl,
        Order(id, orderNumber, status, paymentMethod, paymentStatus),
        Product(id, name, media),
        ProductVariant!variantId(id, name, image),
        User(id, email)
      `, { count: 'exact' })
      .eq('vendorId', parseInt(vendorId))

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .order('requestedAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const formattedData = formatReturnRecords(data)

    return NextResponse.json({
      data: formattedData,
      pagination: { total: count, limit, offset }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      returnId,
      action,
      sellerNotes,
      trackingNumber,
      trackingUrl
    } = body

    const sanitizedTrackingNumber = typeof trackingNumber === 'string' ? trackingNumber.trim() : trackingNumber
    const sanitizedTrackingUrl = typeof trackingUrl === 'string' ? trackingUrl.trim() : trackingUrl

    console.log('[SELLER RETURNS API] PATCH request with returnId:', returnId, 'action:', action)

    if (!returnId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const returnIdNumber = parseInt(returnId)

    const { data: existingReturn, error: fetchReturnError } = await supabase
      .from('Return')
      .select(`
        id,
        orderId,
        returnType,
        variantId,
        productId,
        quantity,
        status,
        trackingNumber,
        trackingUrl,
        Order (
          id,
          status,
          paymentMethod,
          paymentStatus
        )
      `)
      .eq('id', returnIdNumber)
      .single()

    if (fetchReturnError || !existingReturn) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 })
    }

    const paymentMethod = (existingReturn.Order?.paymentMethod || 'cod').toLowerCase()
    const requiresRefund = existingReturn.returnType === 'return' && paymentMethod !== 'cod'

    const baseUpdate: any = {}
    if (sellerNotes !== undefined) {
      baseUpdate.sellerNotes = sellerNotes
    }
    if (sanitizedTrackingNumber !== undefined) {
      baseUpdate.trackingNumber = sanitizedTrackingNumber || null
    }
    if (sanitizedTrackingUrl !== undefined) {
      baseUpdate.trackingUrl = sanitizedTrackingUrl || null
    }

    const restockIfNeeded = async () => {
      if (existingReturn.returnType !== 'return') {
        return
      }

      if (['restocked', 'completed'].includes(existingReturn.status)) {
        return
      }

      const variantId = existingReturn.variantId
      const productId = existingReturn.productId
      const quantity = existingReturn.quantity

      if (variantId) {
        const { data: variant } = await supabase
          .from('ProductVariant')
          .select('stock')
          .eq('id', variantId)
          .single()

        if (variant) {
          const newStock = (variant.stock || 0) + quantity
          await supabase
            .from('ProductVariant')
            .update({ stock: newStock })
            .eq('id', variantId)
        }
      } else if (productId) {
        const { data: product } = await supabase
          .from('Product')
          .select('stock')
          .eq('id', productId)
          .single()

        if (product) {
          const newStock = (product.stock || 0) + quantity
          await supabase
            .from('Product')
            .update({ stock: newStock })
            .eq('id', productId)
        }
      }
    }

    switch (action) {
      case 'approve': {
        if (existingReturn.status !== 'pending') {
          return NextResponse.json({ error: 'Only pending returns can be approved' }, { status: 400 })
        }

        baseUpdate.approvedAt = now
        baseUpdate.status = 'approved'

        await supabase
          .from('Order')
          .update({ status: 'returned' })
          .eq('id', existingReturn.orderId)
        break
      }

      case 'reject': {
        if (existingReturn.status !== 'pending') {
          return NextResponse.json({ error: 'Only pending returns can be rejected' }, { status: 400 })
        }
        baseUpdate.status = 'rejected'
        break
      }

      case 'mark_shipped': {
        const isRefunded = existingReturn.Order?.paymentStatus === 'refunded'
        const canShipFromApproved = !requiresRefund || isRefunded
        
        const allowedStatuses = ['shipped']
        if (canShipFromApproved) allowedStatuses.push('approved')
        if (requiresRefund) allowedStatuses.push('refund_confirmed')

        if (!allowedStatuses.includes(existingReturn.status)) {
          const message = requiresRefund && !isRefunded
            ? 'Refund must be confirmed before marking as shipped'
            : 'Only approved returns can be marked as shipped'
          return NextResponse.json({ error: message }, { status: 400 })
        }

        const trackingValue = typeof baseUpdate.trackingNumber === 'string' && baseUpdate.trackingNumber.trim()
          ? baseUpdate.trackingNumber.trim()
          : typeof existingReturn.trackingNumber === 'string' && existingReturn.trackingNumber.trim()
            ? existingReturn.trackingNumber.trim()
            : null

        if (!trackingValue) {
          return NextResponse.json({ error: 'Tracking number required before marking as shipped' }, { status: 400 })
        }

        baseUpdate.trackingNumber = trackingValue
        baseUpdate.status = 'shipped'
        if (existingReturn.status !== 'shipped') {
          baseUpdate.shippedAt = now
        }
        break
      }

      case 'mark_received': {
        if (!['shipped', 'received'].includes(existingReturn.status)) {
          return NextResponse.json({ error: 'Only shipped returns can be marked as received' }, { status: 400 })
        }
        baseUpdate.status = 'received'
        break
      }

      case 'mark_restocked': {
        if (!['received', 'restocked'].includes(existingReturn.status)) {
          return NextResponse.json({ error: 'Only received returns can be restocked' }, { status: 400 })
        }
        baseUpdate.status = 'restocked'
        await restockIfNeeded()
        break
      }

      case 'confirm_refund': {
        if (!requiresRefund) {
          return NextResponse.json({ error: 'Refund confirmation is not required for this return' }, { status: 400 })
        }

        const allowedStatuses = ['approved', 'refund_confirmed', 'shipped', 'received', 'restocked']
        if (!allowedStatuses.includes(existingReturn.status)) {
          return NextResponse.json({ error: 'Return must be approved before confirming refund' }, { status: 400 })
        }

        if (existingReturn.Order?.paymentStatus !== 'refunded') {
          await supabase
            .from('Order')
            .update({ paymentStatus: 'refunded' })
            .eq('id', existingReturn.orderId)
        }

        baseUpdate.status = 'refund_confirmed'
        break
      }

      case 'mark_completed': {
        const allowedStatuses = ['restocked', 'completed']
        if (!allowedStatuses.includes(existingReturn.status)) {
          return NextResponse.json({ error: 'Return cannot be completed yet' }, { status: 400 })
        }

        if (!requiresRefund) {
          await restockIfNeeded()
        }

        baseUpdate.status = 'completed'
        if (existingReturn.status !== 'completed') {
          baseUpdate.completedAt = now
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('Return')
      .update(baseUpdate)
      .eq('id', returnIdNumber)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data?.[0])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
