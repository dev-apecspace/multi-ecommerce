import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

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
        Vendor(id, name),
        User(id, name, email, phone),
        OrderItem(
          id,
          quantity,
          price,
          vendorId,
          variantId,
          variantName,
          Product(id, name),
          ProductVariant(id, name, image)
        )
      `, { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const transformedData = data || []
    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: transformedData,
      pagination: { total: count, limit, page, totalPages }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, cancellationReason } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Fetch existing order to validate allowed transitions
    const { data: existingOrder, error: existingOrderErr } = await supabase
      .from('Order')
      .select('status')
      .eq('id', parseInt(orderId))
      .single()

    if (existingOrderErr || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const allowedTransitions: Record<string, string[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['completed'],
      cancelled: []
    }

    const allowedForCurrent = allowedTransitions[existingOrder.status] || []
    if (!allowedForCurrent.includes(status)) {
      return NextResponse.json({ error: `Cannot update order from ${existingOrder.status} to ${status}` }, { status: 400 })
    }

    const updateData: any = { status }
    if (cancellationReason && status === 'cancelled') {
      updateData.cancellationReason = cancellationReason
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
        cancellationReason,
        Vendor(id, name),
        User(id, name, email),
        OrderItem(
          id,
          quantity,
          price,
          vendorId,
          variantId,
          variantName,
          Product(id, name, image),
          ProductVariant(id, name)
        )
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
