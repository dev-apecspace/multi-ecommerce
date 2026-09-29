import { isRevenueEligible, getOrderRevenue, isPendingRevenue, getRetainedOrderValue } from '@/lib/order-revenue'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!isAdmin(auth)) return unauthorizedResponse()
    const params = new URL(request.url).searchParams
    const start = params.get('start') || ''
    const end = params.get('end') || ''

    const [usersRes, vendorsRes, productsRes, ordersRes, reviewsRes] = await Promise.all([
      supabase.from('User').select('*', { count: 'exact' }),
      supabase.from('Vendor').select('*', { count: 'exact' }),
      supabase.from('Product').select('*', { count: 'exact' }),
      supabase.from('Order').select('id, total, status, paymentMethod, paymentStatus, createdAt, Return(status,returnType,refundAmount,orderItemId,quantity)', { count: 'exact' }),
      supabase.from('ProductReview').select('*', { count: 'exact' }),
    ])

    if (ordersRes.error) return NextResponse.json({ error: ordersRes.error.message }, { status: 400 })

    const orders = (ordersRes.data || []).filter((order: any) => (!start || String(order.createdAt || '') >= start) && (!end || String(order.createdAt || '') < `${end}T23:59:59.999Z`))
    const revenueOrders = orders.filter(isRevenueEligible)
    const totalRevenue = revenueOrders.reduce((sum: number, order: any) => sum + getOrderRevenue(order), 0)
    const averageOrderValue = revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0
    const temporaryRevenue = orders.filter(isPendingRevenue).reduce((sum: number, order: any) => sum + getRetainedOrderValue(order), 0)
    const cancelledValue = orders.filter((order: any) => order.status === 'cancelled').reduce((sum: number, order: any) => sum + Number(order.total || 0), 0)
    const current = new Date()
    const monthly = Array.from({ length: 6 }, (_, index) => { const date = new Date(current.getFullYear(), current.getMonth() - (5 - index), 1); const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; return { key, month: `T${date.getMonth() + 1}/${date.getFullYear()}`, revenue: 0, orders: 0, paidOrders: 0 } })
    const monthlyByKey = new Map(monthly.map((item) => [item.key, item]))
    for (const order of orders) { const key = String(order.createdAt || '').slice(0, 7); const item = monthlyByKey.get(key); if (!item) continue; item.orders += 1; if (isRevenueEligible(order)) { item.paidOrders += 1; item.revenue += getOrderRevenue(order) } }

    const stats = {
      users: {
        total: usersRes.count || 0,
        active: usersRes.data?.filter((u: any) => u.status === 'active').length || 0,
      },
      vendors: {
        total: vendorsRes.count || 0,
        approved: vendorsRes.data?.filter((v: any) => v.status === 'approved').length || 0,
        pending: vendorsRes.data?.filter((v: any) => v.status === 'pending').length || 0,
        rejected: vendorsRes.data?.filter((v: any) => v.status === 'rejected').length || 0,
      },
      products: {
        total: productsRes.count || 0,
        approved: productsRes.data?.filter((product: any) => product.status === 'approved').length || 0,
        pending: productsRes.data?.filter((product: any) => product.status === 'pending').length || 0,
        rejected: productsRes.data?.filter((product: any) => product.status === 'rejected').length || 0,
      },
      orders: {
        total: orders.length,
        eligibleRevenueOrders: revenueOrders.length,
        pending: orders.filter((order: any) => order.status === 'pending').length,
        processing: orders.filter((order: any) => order.status === 'processing').length,
        shipped: orders.filter((order: any) => order.status === 'shipped').length,
        delivered: orders.filter((order: any) => order.status === 'delivered').length,
        completed: orders.filter((order: any) => order.status === 'completed').length,
        returned: orders.filter((order: any) => order.status === 'returned').length,
        cancelled: orders.filter((order: any) => order.status === 'cancelled').length,
        totalRevenue,
        temporaryRevenue,
        cancelledValue,
        averageOrderValue,
      },
      reviews: {
        total: reviewsRes.count || 0,
      },
      monthly,
      period: { start: start || null, end: end || null },
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
