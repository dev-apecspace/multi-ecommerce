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
          // Get UserProfile for avatar
          let avatar = vendor.vendorLogo || null
          if (vendor.userId) {
            const { data: userProfile } = await supabase
              .from('UserProfile')
              .select('avatar, vendorLogo')
              .eq('userId', vendor.userId)
              .maybeSingle()
            
            if (userProfile) {
              avatar = userProfile.vendorLogo || userProfile.avatar || vendor.vendorLogo || null
            }
          }

          // Get product IDs for this vendor
          const { data: vendorProducts } = await supabase
            .from('Product')
            .select('id')
            .eq('vendorId', vendor.id)
          
          // Calculate rating from reviews (via products)
          let calculatedRating = vendor.rating || 0
          let reviewsCount = 0
          
          if (vendorProducts && vendorProducts.length > 0) {
            const productIds = vendorProducts.map((p: any) => p.id)
            const { data: reviews } = await supabase
              .from('Review')
              .select('rating')
              .in('productId', productIds)
            
            if (reviews && reviews.length > 0) {
              const totalRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
              reviewsCount = reviews.length
              calculatedRating = totalRating / reviewsCount
            }
          }

          // Get followers count (check if VendorFollow table exists, otherwise use vendor.followers)
          let followersCount = vendor.followers || 0
          try {
            const { count } = await supabase
              .from('VendorFollow')
              .select('*', { count: 'exact', head: true })
              .eq('vendorId', vendor.id)
            if (count !== null) {
              followersCount = count
            }
          } catch (e) {
            // VendorFollow table might not exist, use vendor.followers
          }

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
            logo: avatar,
            avatar: avatar,
            rating: calculatedRating,
            reviews_count: reviewsCount,
            followers_count: followersCount || vendor.followers || 0,
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
