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

    const [usersRes, vendorsRes, productsRes, ordersRes, reviewsRes] = await Promise.all([
      supabase.from('User').select('*', { count: 'exact' }),
      supabase.from('Vendor').select('*', { count: 'exact' }),
      supabase.from('Product').select('*', { count: 'exact' }),
      supabase.from('Order').select('total, status', { count: 'exact' }),
      supabase.from('Review').select('*', { count: 'exact' }),
    ])

    const settledOrders = ordersRes.data?.filter((order: any) =>
      order.status === 'delivered' || order.status === 'completed'
    ) || []
    const totalRevenue = settledOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
    const averageOrderValue = settledOrders.length > 0 ? totalRevenue / settledOrders.length : 0

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
      },
      orders: {
        total: settledOrders.length,
        totalRevenue,
        averageOrderValue,
      },
      reviews: {
        total: reviewsRes.count || 0,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
