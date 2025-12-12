import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    const categoryId = searchParams.get('categoryId')
    const vendorId = searchParams.get('vendorId')
    const search = searchParams.get('search')
    const slug = searchParams.get('slug')
    const showPending = searchParams.get('showPending') === 'true'

    let query = supabase
      .from('Product')
      .select('*, Category(name, slug), SubCategory(name, slug), Vendor(name, status, slug, logo, rating, followers), ProductVariant(*), ProductAttribute(id, name, ProductAttributeValue(id, value))', { count: 'exact' })

    if (!showPending) {
      query = query.eq('status', 'approved')
    }

    if (categoryId) {
      query = query.eq('categoryId', categoryId)
    }

    if (vendorId) {
      query = query.eq('vendorId', vendorId)
    }

    if (slug) {
      query = query.eq('slug', slug)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    let filteredData = data?.filter((product: any) => {
      if (showPending) {
        return true
      }
      return product.Vendor?.status === 'approved'
    }) || []

    // Enrich Vendor data with avatar and calculated rating
    if (filteredData.length > 0) {
      const vendorIds = [...new Set(filteredData.map((p: any) => p.vendorId).filter(Boolean))]
      
      if (vendorIds.length > 0) {
        // Get vendors with enriched data
        const { data: vendors } = await supabase
          .from('Vendor')
          .select('id, userId, logo, rating, followers')
          .in('id', vendorIds)
        
        const vendorMap = new Map()
        if (vendors) {
          await Promise.all(
            vendors.map(async (vendor: any) => {
              // Get avatar from logo or UserProfile
              let avatar = vendor.logo || null
              if (!avatar && vendor.userId) {
                const { data: userProfile } = await supabase
                  .from('UserProfile')
                  .select('avatar')
                  .eq('userId', vendor.userId)
                  .maybeSingle()
                
                if (userProfile?.avatar) {
                  avatar = userProfile.avatar
                }
              }

              // Calculate rating from reviews
              let calculatedRating = vendor.rating || 0
              const { data: vendorProducts } = await supabase
                .from('Product')
                .select('id')
                .eq('vendorId', vendor.id)
              
              if (vendorProducts && vendorProducts.length > 0) {
                const productIds = vendorProducts.map((p: any) => p.id)
                const { data: reviews } = await supabase
                  .from('Review')
                  .select('rating')
                  .in('productId', productIds)
                
                if (reviews && reviews.length > 0) {
                  const totalRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
                  calculatedRating = totalRating / reviews.length
                }
              }

              vendorMap.set(vendor.id, {
                ...vendor,
                logo: avatar,
                avatar: avatar,
                rating: calculatedRating,
                followers_count: vendor.followers || 0,
              })
            })
          )
        }

        // Update products with enriched vendor data
        filteredData = filteredData.map((product: any) => {
          if (product.Vendor && vendorMap.has(product.vendorId)) {
            const enrichedVendor = vendorMap.get(product.vendorId)
            product.Vendor = {
              ...product.Vendor,
              ...enrichedVendor,
            }
          }
          return product
        })
      }
    }

    // Get active campaigns and their products
    const now = new Date().toISOString()
    // Consider active và sắp diễn ra để hiển thị giá CTKM cho client
    const { data: activeCampaigns } = await supabase
      .from('Campaign')
      .select('*')
      .in('status', ['active', 'upcoming'])
      .gte('endDate', now)

    // Helper: compute discounted price from a base price and campaign
    const computeDiscountPrice = (basePrice: number, campaign: any) => {
      if (!campaign) return basePrice
      if (campaign.type === 'percentage') {
        return Math.max(0, basePrice - (basePrice * campaign.discountValue) / 100)
      }
      if (campaign.type === 'fixed') {
        return Math.max(0, basePrice - campaign.discountValue)
      }
      return basePrice
    }

    if (activeCampaigns && activeCampaigns.length > 0) {
      // Get all campaign products for active campaigns
      const { data: campaignProducts } = await supabase
        .from('CampaignProduct')
        .select('*')
        .eq('status', 'approved')
        .in(
          'campaignId',
          activeCampaigns.map((c) => c.id)
        )

      // Build a map of campaign products
      const campaignProductMap = new Map()
      campaignProducts?.forEach((cp) => {
        const key = `${cp.productId}-${cp.variantId || 'null'}`
        if (!campaignProductMap.has(key)) {
          campaignProductMap.set(key, [])
        }
        campaignProductMap.get(key).push({
          campaignId: cp.campaignId,
          ...activeCampaigns.find((c) => c.id === cp.campaignId),
        })
      })

      // Add campaign info to products
      filteredData.forEach((product: any) => {
        const productCampaigns = campaignProductMap.get(`${product.id}-null`) || []

        // Choose best campaign (max discount value in currency)
        const pickBestCampaign = (basePrice: number, campaigns: any[]) => {
          if (!campaigns || campaigns.length === 0) return null
          let best = campaigns[0]
          let bestPrice = computeDiscountPrice(basePrice, best)
          campaigns.forEach((c) => {
            const price = computeDiscountPrice(basePrice, c)
            if (price < bestPrice) {
              best = c
              bestPrice = price
            }
          })
          return { campaign: best, salePrice: bestPrice }
        }

        // Variants
        if (product.ProductVariant && product.ProductVariant.length > 0) {
          product.ProductVariant = product.ProductVariant.map((variant: any) => {
            const variantCampaigns = campaignProductMap.get(`${product.id}-${variant.id}`) || []
            const basePrice = variant.price ?? product.price
            const originalPrice = variant.originalPrice ?? product.originalPrice ?? basePrice
            const best = pickBestCampaign(basePrice, variantCampaigns.length ? variantCampaigns : productCampaigns)
            return {
              ...variant,
              campaigns: variantCampaigns,
              appliedCampaign: best?.campaign || null,
              salePrice: best ? best.salePrice : null,
              originalPrice: originalPrice,
            }
          })
        }

        const productBasePrice = product.price
        const bestProductCampaign = pickBestCampaign(productBasePrice, productCampaigns)
        product.campaigns = productCampaigns
        product.appliedCampaign = bestProductCampaign?.campaign || null
        product.salePrice = bestProductCampaign ? bestProductCampaign.salePrice : null
      })
    }

    return NextResponse.json({
      data: filteredData,
      pagination: {
        total: filteredData.length,
        limit,
        offset,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('Product')
      .insert([body])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
