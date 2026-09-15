import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isVendor, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || (!isVendor(auth) && !isAdmin(auth))) return unauthorizedResponse()

    const { approveOrder = false } = await request.json().catch(() => ({}))
    const { id } = await params
    const orderId = Number(id)
    if (!Number.isInteger(orderId)) return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })

    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, vendorId, paymentMethod, paymentStatus, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (isVendor(auth) && order.vendorId !== auth.vendorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    if (!['bank', 'wallet'].includes(order.paymentMethod)) {
      return NextResponse.json({ error: 'Only bank-transfer or e-wallet orders can be confirmed' }, { status: 400 })
    }
    if (order.paymentStatus === 'paid') return NextResponse.json({ error: 'Order payment is already confirmed' }, { status: 400 })
    if (approveOrder && order.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending orders can be approved' }, { status: 400 })
    }

    // A single update prevents an order being approved without the payment record.
    const update = approveOrder ? { paymentStatus: 'paid', status: 'processing' } : { paymentStatus: 'paid' }
    const { data: updatedOrder, error: updateError } = await supabase
      .from('Order')
      .update(update)
      .eq('id', orderId)
      .select('id, orderNumber, status, paymentMethod, paymentStatus, total')
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
    return NextResponse.json({
      message: approveOrder ? 'Payment confirmed and order approved' : 'Payment confirmed',
      order: updatedOrder,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
