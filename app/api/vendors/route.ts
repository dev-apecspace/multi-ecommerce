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
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy')

    let query = supabase
      .from('Vendor')
      .select('*', { count: 'exact' })

    if (slug) {
      // Hỗ trợ URL cũ dùng ID, đồng thời ưu tiên slug cho URL shop chuẩn.
      query = /^\d+$/.test(slug) ? query.eq('id', parseInt(slug)) : query.eq('slug', slug)
    } else {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (sortBy === 'followers') {
      query = query.order('followers', { ascending: false })
    } else if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('rating', { ascending: false })
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    let enrichedData = data || []
    if (data && data.length > 0) {
      enrichedData = await Promise.all(
        data.map(async (vendor: any) => {
          // Logo/bìa được lưu chuẩn trên Vendor. UserProfile chỉ là fallback cho dữ liệu cũ.
          let avatar = vendor.logo || vendor.vendorLogo || null
          if (vendor.userId) {
            const { data: userProfile } = await supabase
              .from('UserProfile')
              .select('avatar, vendorLogo')
              .eq('userId', vendor.userId)
              .maybeSingle()
            
            if (userProfile) {
              avatar = vendor.logo || userProfile.vendorLogo || userProfile.avatar || vendor.vendorLogo || null
            }
          }

          // Get product IDs for this vendor
          const { data: vendorProducts } = await supabase
            .from('Product')
            .select('id')
            .eq('vendorId', vendor.id)
            .eq('status', 'approved')
          
          // Calculate rating from reviews (via products)
          let calculatedRating = vendor.rating || 0
          let reviewsCount = 0
          
          if (vendorProducts && vendorProducts.length > 0) {
            const productIds = vendorProducts.map((p: any) => p.id)
            const { data: reviews } = await supabase
              .from('ProductReview')
              .select('rating')
              .in('productId', productIds)
            
            if (reviews && reviews.length > 0) {
              const totalRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
              reviewsCount = reviews.length
              calculatedRating = totalRating / reviewsCount
            }
          }

          // ShopFollow là nguồn dữ liệu theo dõi chuẩn, đồng bộ với API theo dõi ở Client.
          let followersCount = vendor.followers || 0
          try {
            const { count } = await supabase
              .from('ShopFollow')
              .select('*', { count: 'exact', head: true })
              .eq('vendorId', vendor.id)
            if (count !== null) {
              followersCount = count
            }
          } catch (e) {
            // Nếu bảng chưa sẵn sàng, dùng số đếm đã lưu trên Vendor.
          }

          const { data: shopData } = await supabase
            .from('Shop')
            .select('*')
            .eq('vendorId', vendor.id)
            .maybeSingle()
          
          const shop = shopData || null
          const coverImage = vendor.coverImage || shop?.image || shop?.coverImage || null
          let shopDetail = {}
          
          if (shop && shop.id) {
            const { data: detailData } = await supabase
              .from('ShopDetail')
              .select('*')
              .eq('shopId', shop.id)
              .maybeSingle()
            shopDetail = detailData || {}
          }

          // Thông tin liên hệ có thể nằm ở hồ sơ shop mới hoặc dữ liệu Vendor/User
          // của các shop cũ. Luôn trả về một cấu trúc thống nhất cho Client.
          let userContact: { email?: string | null; phone?: string | null } | null = null
          if (vendor.userId) {
            const { data: userData } = await supabase
              .from('User')
              .select('email, phone')
              .eq('id', vendor.userId)
              .maybeSingle()
            userContact = userData
          }
          
          return {
            ...vendor,
            logo: avatar,
            avatar: avatar,
            image: coverImage,
            banner: coverImage,
            coverImage,
            products: vendorProducts?.length ?? vendor.products ?? 0,
            products_count: vendorProducts?.length ?? vendor.products ?? 0,
            rating: calculatedRating,
            reviews_count: reviewsCount,
            followers_count: followersCount || vendor.followers || 0,
            email: (shopDetail as any)?.email || userContact?.email || vendor.email || null,
            phone: (shopDetail as any)?.phone || userContact?.phone || vendor.phone || null,
            address: (shopDetail as any)?.address || vendor.businessAddress || vendor.address || null,
            Shop: shop ? {
              ...shop,
              ShopDetail: shopDetail,
            } : null,
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
