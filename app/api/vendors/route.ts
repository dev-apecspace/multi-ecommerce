import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const status = searchParams.get('status') || 'approved'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    let query = supabase
      .from('Vendor')
      .select('*', { count: 'exact' })

    if (slug) {
      query = query.eq('slug', slug)
    } else {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    let enrichedData = data || []
    if (data && data.length > 0) {
      enrichedData = await Promise.all(
        data.map(async (vendor: any) => {
          const { data: shopData } = await supabase
            .from('Shop')
            .select('*')
            .eq('vendorId', vendor.id)
            .maybeSingle()
          
          const shop = shopData || {}
          let shopDetail = {}
          
          if (shop?.id) {
            const { data: detailData } = await supabase
              .from('ShopDetail')
              .select('*')
              .eq('shopId', shop.id)
              .maybeSingle()
            shopDetail = detailData || {}
          }
          
          return {
            ...vendor,
            Shop: {
              ...shop,
              ShopDetail: shopDetail,
            },
          }
        })
      )
    }

    return NextResponse.json({
      data: enrichedData,
      pagination: { total: count, limit, offset },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
