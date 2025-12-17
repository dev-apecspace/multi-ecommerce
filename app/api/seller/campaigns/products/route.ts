import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const vendorId = searchParams.get('vendorId')

    if (!campaignId || !vendorId) {
      return NextResponse.json({ error: 'Campaign ID and Vendor ID are required' }, { status: 400 })
    }

    // Verify campaign exists (but allow viewing products regardless of status)
    const { data: campaign, error: campaignError } = await supabase
      .from('Campaign')
      .select('status')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get campaign products registered by this vendor (always allowed for viewing)
    const { data: campaignProducts, error } = await supabase
      .from('CampaignProduct')
      .select(
        `
        *,
        Product(id, name, slug, price, originalPrice, taxApplied, taxRate, taxIncluded, media),
        ProductVariant(id, name, price, originalPrice, image)
      `
      )
      .eq('campaignId', campaignId)
      .eq('vendorId', vendorId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(campaignProducts)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, vendorId, productId, variantId, quantity } = body

    if (!campaignId || !vendorId || !productId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Campaign ID, Vendor ID, Product ID, and Quantity are required' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
    }

    // Check campaign status to allow product registrations only when open
    const { data: campaign, error: campaignError } = await supabase
      .from('Campaign')
      .select('status')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!['draft', 'upcoming'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Campaign is not accepting product registrations' },
        { status: 400 }
      )
    }

    // Auto-create vendor registration if it doesn't exist (when adding first product)
    const { data: registration } = await supabase
      .from('CampaignVendorRegistration')
      .select('*')
      .eq('campaignId', campaignId)
      .eq('vendorId', vendorId)
      .single()

    if (!registration) {
      // Only allow auto-registration in draft/upcoming states
      const { error: createRegError } = await supabase
        .from('CampaignVendorRegistration')
        .insert([
          {
            campaignId,
            vendorId,
            status: 'pending',
            registeredAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])

      if (createRegError) {
        return NextResponse.json({ error: 'Failed to auto-register vendor for campaign' }, { status: 400 })
      }
    }

    // Check if product already registered
    const { data: existing } = await supabase
      .from('CampaignProduct')
      .select('*')
      .eq('campaignId', campaignId)
      .eq('productId', productId)
      .eq('variantId', variantId || null)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Product is already registered for this campaign' }, { status: 400 })
    }

    // Check for overlapping campaigns
    const { data: otherCampaigns } = await supabase
      .from('CampaignProduct')
      .select(`
        campaignId,
        Campaign (
          id,
          name,
          startDate,
          endDate,
          status
        )
      `)
      .eq('productId', productId)
      .eq('variantId', variantId || null)
      .neq('campaignId', campaignId)

    if (otherCampaigns && otherCampaigns.length > 0) {
      const currentStart = new Date(campaign.startDate).getTime()
      const currentEnd = new Date(campaign.endDate).getTime()

      const conflictingCampaign = otherCampaigns.find((cp: any) => {
        if (!cp.Campaign || cp.Campaign.status === 'ended') return false
        
        const otherStart = new Date(cp.Campaign.startDate).getTime()
        const otherEnd = new Date(cp.Campaign.endDate).getTime()

        // Ignore expired campaigns
        if (otherEnd < Date.now()) return false

        // Check overlap: (StartA <= EndB) and (EndA >= StartB)
        return (currentStart <= otherEnd && currentEnd >= otherStart)
      })

      if (conflictingCampaign) {
        return NextResponse.json({ 
          error: `Sản phẩm đã tham gia chương trình "${conflictingCampaign.Campaign.name}" trong thời gian này.` 
        }, { status: 400 })
      }
    }

    // Verify product exists (ownership is already implied by using seller's own list)
    const { data: product, error: productError } = await supabase
      .from('Product')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Validate stock (variant stock if provided, otherwise product stock)
    let availableStock = product.stock || 0
    if (variantId) {
      const { data: variant, error: variantError } = await supabase
        .from('ProductVariant')
        .select('stock')
        .eq('id', variantId)
        .eq('productId', productId)
        .single()

      if (variantError || !variant) {
        return NextResponse.json({ error: 'Variant not found for this product' }, { status: 404 })
      }
      availableStock = variant.stock || 0
    }

    if (quantity > availableStock) {
      return NextResponse.json(
        { error: 'Quantity must be less than or equal to current stock' },
        { status: 400 }
      )
    }

    // Create campaign product registration
    const { data, error } = await supabase
      .from('CampaignProduct')
      .insert([
        {
          campaignId,
          vendorId,
          productId,
          variantId: variantId || null,
          quantity,
          purchasedQuantity: 0,
          status: 'pending',
          registeredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignProductId, quantity } = body

    if (!campaignProductId || quantity === undefined) {
      return NextResponse.json({ error: 'Campaign Product ID and Quantity are required' }, { status: 400 })
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
    }

    // Load campaign product with product/variant for stock validation
    const { data: existing, error: existingError } = await supabase
      .from('CampaignProduct')
      .select('id, productId, variantId')
      .eq('id', campaignProductId)
      .single()

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Campaign Product not found' }, { status: 404 })
    }

    // Validate stock similar to POST
    let availableStock = 0
    const { data: product, error: productError } = await supabase
      .from('Product')
      .select('stock')
      .eq('id', existing.productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    availableStock = product.stock || 0

    if (existing.variantId) {
      const { data: variant, error: variantError } = await supabase
        .from('ProductVariant')
        .select('stock')
        .eq('id', existing.variantId)
        .eq('productId', existing.productId)
        .single()

      if (variantError || !variant) {
        return NextResponse.json({ error: 'Variant not found for this product' }, { status: 404 })
      }
      availableStock = variant.stock || 0
    }

    if (quantity > availableStock) {
      return NextResponse.json(
        { error: 'Quantity must be less than or equal to current stock' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('CampaignProduct')
      .update({ quantity, updatedAt: new Date().toISOString() })
      .eq('id', campaignProductId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignProductId } = body

    if (!campaignProductId) {
      return NextResponse.json({ error: 'Campaign Product ID is required' }, { status: 400 })
    }

    const { error } = await supabase.from('CampaignProduct').delete().eq('id', campaignProductId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Campaign product registration deleted' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
