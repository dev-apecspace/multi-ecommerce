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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { returnId, action, status, cancelReason } = body

    if (!returnId) {
      return NextResponse.json({ error: 'Return ID required' }, { status: 400 })
    }

    if (!action && !status) {
      return NextResponse.json({ error: 'Action or status required' }, { status: 400 })
    }

    if (action === 'confirm_exchange') {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('Return')
        .update({ status: 'completed', completedAt: now })
        .eq('id', parseInt(returnId))
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(data?.[0])
    }

    if (status === 'cancelled') {
      const { data: existingReturn } = await supabase
        .from('Return')
        .select('status')
        .eq('id', parseInt(returnId))
        .single()

      if (existingReturn?.status !== 'pending') {
        return NextResponse.json({ error: 'Can only cancel pending returns' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('Return')
        .update({
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          sellerNotes: cancelReason
        })
        .eq('id', parseInt(returnId))
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(data?.[0])
    }

    return NextResponse.json({ error: 'Invalid action or status' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const orderId = searchParams.get('orderId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    let query = supabase
      .from('Return')
      .select(`
        id,
        orderId,
        orderItemId,
        productId,
        variantId,
        reason,
        description,
        returnType,
        images,
        refundAmount,
        quantity,
        status,
        sellerNotes,
        requestedAt,
        approvedAt,
        completedAt,
        trackingNumber,
        Order(id, orderNumber, status, paymentMethod, paymentStatus),
        Product(id, name, media),
        ProductVariant!variantId(id, name, image),
        Vendor(id, name)
      `, { count: 'exact' })
      .eq('userId', parseInt(userId))

    if (status) {
      query = query.eq('status', status)
    }

    if (orderId) {
      query = query.eq('orderId', parseInt(orderId))
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      orderId,
      orderItemId,
      productId,
      variantId,
      reason,
      description,
      returnType = 'return',
      exchangeVariantId,
      images = [],
      quantity = 1
    } = body

    console.log('[RETURN API] Creating return with data:', { userId, orderId, orderItemId, productId, variantId, reason, quantity })

    if (!userId || !orderId || !orderItemId || !reason || productId === undefined) {
      console.error('[RETURN API] Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const parsedOrderItemId = parseInt(orderItemId)
    const parsedUserId = parseInt(userId)
    const parsedOrderId = parseInt(orderId)
    const parsedProductId = parseInt(productId)

    const { data: activeReturns, error: activeReturnsError } = await supabase
      .from('Return')
      .select('id, status')
      .eq('orderItemId', parsedOrderItemId)
      .not('status', 'in', '("rejected","completed","cancelled")')

    if (activeReturnsError) {
      console.error('[RETURN API] Error checking existing returns:', activeReturnsError.message)
      return NextResponse.json({ error: 'Unable to process return request' }, { status: 400 })
    }

    if (activeReturns && activeReturns.length > 0) {
      return NextResponse.json({ error: 'Return request already exists for this item' }, { status: 400 })
    }

    // Get the order item to verify details and get vendor/price info
    const { data: orderItem, error: orderItemError } = await supabase
      .from('OrderItem')
      .select(`
        price, 
        quantity, 
        vendorId,
        Order (
          status,
          updatedAt
        )
      `)
      .eq('id', parsedOrderItemId)
      .single()

    if (orderItemError || !orderItem) {
      console.error('[RETURN API] Order item not found:', orderItemError?.message)
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    // Check if order is delivered
    // @ts-ignore
    const orderStatus = orderItem.Order?.status
    // @ts-ignore
    const orderDate = orderItem.Order?.updatedAt

    if (orderStatus !== 'delivered') {
      return NextResponse.json({ error: 'Only delivered orders can be returned' }, { status: 400 })
    }

    // Check 3-day window
    const deliveryDate = new Date(orderDate)
    const currentDate = new Date()
    const diffTime = Math.abs(currentDate.getTime() - deliveryDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 3) {
      return NextResponse.json({ 
        error: 'Return period expired. Returns are only accepted within 3 days of delivery.' 
      }, { status: 400 })
    }

    // Calculate refund amount (price * quantity requested for return)
    const refundAmount = orderItem.price * quantity

    // Create return request
    const { data: returnRecord, error: returnError } = await supabase
      .from('Return')
      .insert([
        {
          userId: parsedUserId,
          orderId: parsedOrderId,
          orderItemId: parsedOrderItemId,
          productId: parsedProductId,
          variantId: variantId ? parseInt(variantId) : null,
          vendorId: orderItem.vendorId,
          reason,
          description,
          returnType,
          exchangeVariantId: exchangeVariantId ? parseInt(exchangeVariantId) : null,
          images: images.length > 0 ? images : null,
          refundAmount,
          quantity,
          status: 'pending'
        }
      ])
      .select()

    if (returnError) {
      console.error('[RETURN API] Error creating return:', returnError.message, returnError.details)
      return NextResponse.json({ error: returnError.message }, { status: 400 })
    }

    console.log('[RETURN API] Return created successfully:', returnRecord?.[0]?.id)
    return NextResponse.json(returnRecord?.[0], { status: 201 })
  } catch (error) {
    console.error('[RETURN API] Exception:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

