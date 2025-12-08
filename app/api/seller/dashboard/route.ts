import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

    const { data: vendor } = await supabase
      .from('Vendor')
      .select('*')
      .eq('id', vendorId)
      .single()

    const stats = {
      productCount: 0,
      orderCount: 0,
      completedOrders: 0,
      totalRevenue: 0,
      averageRating: 0,
      followers: 0,
    }

    return NextResponse.json({
      vendor: vendor || {},
      stats,
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
