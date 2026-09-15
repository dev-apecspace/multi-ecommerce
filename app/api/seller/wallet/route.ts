import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)

    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const vendorId = auth.vendorId

    const [ordersRes, withdrawalsRes] = await Promise.all([
      supabase.from('Order').select('orderNumber, total, status, createdAt').eq('vendorId', vendorId),
      supabase.from('WithdrawRequest').select('*').eq('vendorId', vendorId),
    ])

    const settledOrders = ordersRes.data?.filter((order: any) =>
      order.status === 'delivered' || order.status === 'completed'
    ) || []
    const totalEarnings = settledOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
    const completedWithdrawals = withdrawalsRes.data?.filter((w: any) => w.status === 'completed') || []
    const pendingWithdrawals = withdrawalsRes.data?.filter((w: any) => w.status === 'pending') || []
    const totalWithdrawals = completedWithdrawals.reduce((sum: number, withdrawal: any) => sum + (withdrawal.amount || 0), 0)
    const transactions = [
      ...settledOrders.map((order: any) => ({
        id: `order-${order.orderNumber}`, type: 'income', description: `Bán hàng đơn ${order.orderNumber}`,
        amount: order.total || 0, date: order.createdAt, status: 'completed',
      })),
      ...(withdrawalsRes.data || []).map((withdrawal: any) => ({
        id: `withdrawal-${withdrawal.id}`, type: 'withdraw', description: 'Rút tiền',
        amount: -(withdrawal.amount || 0), date: withdrawal.createdAt, status: withdrawal.status,
      })),
    ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

    return NextResponse.json({
      balance: totalEarnings - totalWithdrawals,
      totalEarnings,
      totalWithdrawals,
      pendingAmount: pendingWithdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0),
      completedWithdrawalCount: completedWithdrawals.length,
      pendingWithdrawalCount: pendingWithdrawals.length,
      transactions,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
