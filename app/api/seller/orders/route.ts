import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 })
    }

    let query = supabase
      .from('Order')
      .select(`
        id,
        orderNumber,
        status,
        total,
        shippingCost,
        date,
        paymentMethod,
        paymentStatus,
        shippingAddress,
        estimatedDelivery,
        User(id, name, email, phone),
        OrderItem(
          id,
          quantity,
          price,
          variantId,
          variantName,
          Product(id, name, media),
          ProductVariant(id, name, image)
        )
      `, { count: 'exact' })
      .eq('vendorId', parseInt(vendorId))

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Transform data
    const transformedData = data?.map((order: any) => {
      const items = order.OrderItem?.filter((item: any) => item.Product) || []
      
      // Transform media to image
      const transformedItems = items.map((item: any) => {
        if (item.Product && item.Product.media) {
            const media = item.Product.media
            let image = null
            if (Array.isArray(media) && media.length > 0) {
              const mainImage = media.find((m: any) => m.isMain)
              image = mainImage ? mainImage.url : media[0].url
            }
            item.Product.image = image
        }
        return item
      })

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        shippingCost: order.shippingCost,
        date: order.date,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        estimatedDelivery: order.estimatedDelivery,
        User: order.User,
        OrderItem: transformedItems
      }
    })

    return NextResponse.json({
      data: transformedData,
      pagination: { total: count, limit, offset }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, shippingTrackingNumber, vendorId } = body

    if (!orderId || !status || !vendorId) {
      return NextResponse.json({ error: 'Order ID, status and vendor ID required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Verify order belongs to this vendor and check payment status
    const { data: orderData, error: orderError } = await supabase
      .from('Order')
      .select('id, vendorId, paymentMethod, paymentStatus, status')
      .eq('id', parseInt(orderId))
      .single()

    if (orderError || !orderData || orderData.vendorId !== parseInt(vendorId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Add allowed transitions check for seller updates. Sellers should only transition orders in the normal flow.
    const allowedTransitions: Record<string, string[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    }

    const currentStatus = orderData.status
    const allowedStatusesForCurrent = allowedTransitions[currentStatus] || []
    if (!allowedStatusesForCurrent.includes(status)) {
      return NextResponse.json({ error: `Cannot update order from ${currentStatus} to ${status}` }, { status: 400 })
    }

    // If trying to approve/process order with bank transfer, check payment status
    if ((status === 'processing' || status === 'shipped') && orderData.paymentMethod === 'bank') {
      if (orderData.paymentStatus !== 'paid') {
        return NextResponse.json({ 
          error: 'Không thể duyệt đơn hàng. Vui lòng xác nhận thanh toán trước khi duyệt đơn.' 
        }, { status: 400 })
      }
    }

    const updateData: any = { status }
    if (shippingTrackingNumber) {
      updateData.shippingInfo = JSON.stringify({ trackingNumber: shippingTrackingNumber })
    }

    const { data, error } = await supabase
      .from('Order')
      .update(updateData)
      .eq('id', parseInt(orderId))
      .select(`
        id,
        orderNumber,
        status,
        total,
        shippingCost,
        date,
        paymentMethod,
        paymentStatus,
        shippingAddress,
        estimatedDelivery,
        User(id, name, email, phone),
        OrderItem(
          id,
          quantity,
          price,
          variantId,
          variantName,
          Product(id, name, media),
          ProductVariant(id, name, image)
        )
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = data[0]
    
    const items = order.OrderItem?.filter((item: any) => item.Product) || []
    // Transform media to image
    const transformedItems = items.map((item: any) => {
      if (item.Product && item.Product.media) {
          const media = item.Product.media
          let image = null
          if (Array.isArray(media) && media.length > 0) {
            const mainImage = media.find((m: any) => m.isMain)
            image = mainImage ? mainImage.url : media[0].url
          }
          item.Product.image = image
      }
      return item
    })

    const transformedData = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      shippingCost: order.shippingCost,
      date: order.date,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      estimatedDelivery: order.estimatedDelivery,
      User: order.User,
      OrderItem: transformedItems
    }

    return NextResponse.json({ data: transformedData })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
