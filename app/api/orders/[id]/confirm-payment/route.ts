import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isVendor, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || (!isVendor(auth) && !isAdmin(auth))) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const orderId = parseInt(id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, vendorId, paymentMethod, paymentStatus')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // If vendor, verify order belongs to them
    if (isVendor(auth) && order.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if payment method requires confirmation
    if (order.paymentMethod !== 'bank') {
      return NextResponse.json({ 
        error: 'Chỉ có thể xác nhận thanh toán cho đơn hàng chuyển khoản' 
      }, { status: 400 })
    }

    // Check if already paid
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ 
        error: 'Đơn hàng đã được xác nhận thanh toán' 
      }, { status: 400 })
    }

    // Update payment status to paid
    const { data: updatedOrder, error: updateError } = await supabase
      .from('Order')
      .update({ paymentStatus: 'paid' })
      .eq('id', orderId)
      .select(`
        id,
        orderNumber,
        status,
        paymentMethod,
        paymentStatus,
        total
      `)
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Đã xác nhận thanh toán thành công',
      order: updatedOrder
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

