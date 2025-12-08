import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
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
        shippingAddress,
        estimatedDelivery,
        Vendor(id, name),
        OrderItem(
          id,
          quantity,
          price,
          vendorId,
          variantId,
          Product(id, name),
          ProductVariant(id, name),
          productId
        )
      `, { count: 'exact' })
      .eq('userId', parseInt(userId))

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      data,
      pagination: { total: count, limit, offset }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, cartItems, shippingAddress, paymentMethod, shippingMethod, estimatedDelivery } = body

    if (!userId || !cartItems || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const parsedUserId = parseInt(userId)

    // Calculate shipping cost based on method
    const shippingCostPerVendor = shippingMethod === "express" ? 30000 : 10000

    // Group cart items by vendorId
    const itemsByVendor: Map<number, any[]> = new Map()

    for (const item of cartItems) {
      if (!item.vendorId) {
        return NextResponse.json({ error: 'Cart item must have vendorId' }, { status: 400 })
      }
      const vendorId = parseInt(item.vendorId)
      if (!itemsByVendor.has(vendorId)) {
        itemsByVendor.set(vendorId, [])
      }
      itemsByVendor.get(vendorId)!.push(item)
    }

    const createdOrders = []

    // Create separate Order for each vendor
    for (const [vendorId, vendorItems] of itemsByVendor.entries()) {
      const itemsSubtotal = vendorItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      const vendorTotal = itemsSubtotal + shippingCostPerVendor
      const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      const { data: orderData, error: orderError } = await supabase
        .from('Order')
        .insert([{
          orderNumber,
          userId: parsedUserId,
          vendorId,
          status: 'pending',
          total: vendorTotal,
          shippingCost: shippingCostPerVendor,
          paymentMethod,
          shippingAddress: JSON.stringify(shippingAddress),
          estimatedDelivery
        }])
        .select()

      if (orderError) {
        return NextResponse.json({ error: orderError.message }, { status: 400 })
      }

      const orderId = orderData[0].id
      createdOrders.push(orderData[0])

      // Create OrderItems for this vendor
      const orderItems = vendorItems.map((item: any) => ({
        orderId,
        productId: parseInt(item.productId),
        vendorId,
        variantId: item.variantId ? parseInt(item.variantId) : null,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price)
      }))

      const { error: itemsError } = await supabase
        .from('OrderItem')
        .insert(orderItems)

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 400 })
      }
    }

    // Clear cart for this user
    await supabase
      .from('CartItem')
      .delete()
      .eq('userId', parsedUserId)

    // Fetch complete order data for all created orders
    const { data: allOrders } = await supabase
      .from('Order')
      .select(`
        id,
        orderNumber,
        status,
        total,
        shippingCost,
        date,
        shippingAddress,
        paymentMethod,
        Vendor(id, name),
        OrderItem(
          id,
          quantity,
          price,
          vendorId,
          variantId,
          Product(id, name),
          ProductVariant(id, name, image)
        )
      `)
      .in('id', createdOrders.map(o => o.id))

    return NextResponse.json({ data: allOrders }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status required' }, { status: 400 })
    }

    // Only allow cancellation of pending orders
    const { data: existingOrder, error: fetchError } = await supabase
      .from('Order')
      .select('status')
      .eq('id', parseInt(orderId))
      .single()

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (existingOrder.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 })
    }

    // Update order status
    const { data, error } = await supabase
      .from('Order')
      .update({ status })
      .eq('id', parseInt(orderId))
      .select(`
        id,
        orderNumber,
        status,
        total,
        shippingCost,
        date,
        paymentMethod,
        shippingAddress,
        Vendor(id, name),
        OrderItem(
          id,
          quantity,
          price,
          vendorId,
          variantId,
          Product(id, name),
          ProductVariant(id, name)
        )
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
