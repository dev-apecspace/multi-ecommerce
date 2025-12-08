import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const [usersRes, vendorsRes, productsRes, ordersRes, reviewsRes] = await Promise.all([
      supabase.from('User').select('*', { count: 'exact' }),
      supabase.from('Vendor').select('*', { count: 'exact' }),
      supabase.from('Product').select('*', { count: 'exact' }),
      supabase.from('Order').select('total', { count: 'exact' }),
      supabase.from('Review').select('*', { count: 'exact' }),
    ])

    const totalRevenue = ordersRes.data?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0
    const averageOrderValue = (ordersRes.count || 0) > 0 ? totalRevenue / ordersRes.count : 0

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
        total: ordersRes.count || 0,
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
