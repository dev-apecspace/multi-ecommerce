import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'
import { getProductWithVariants } from '@/lib/product-query'
import { generateSlug } from '@/lib/utils'

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

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    const status = searchParams.get('status')

    const vendorId = auth.vendorId

    let query = supabase
      .from('Product')
      .select('id, name, slug, price, originalPrice, stock, status, taxApplied, taxRate, taxIncluded, media, Category(name, slug), SubCategory(name, slug), ProductVariant(id, name, price, stock, image), CampaignProduct(id, campaignId, variantId, Campaign(id, name, status, startDate, endDate))', { count: 'exact' })
      .eq('vendorId', vendorId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count,
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
    const auth = await getAuthFromRequest(request)
    
    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const body = await request.json()

    const media = body.images && Array.isArray(body.images) && body.images.length > 0
      ? body.images.map((img: any, index: number) => ({
          url: img.image || img.url,
          type: img.mediaType || 'image',
          isMain: img.isMain || false,
          order: index,
        }))
      : []

    const basePrice = parseFloat(body.price)
    const taxApplied = body.taxApplied !== false
    const taxRate = taxApplied && body.taxRate ? parseFloat(body.taxRate) : (taxApplied ? 10 : 0)
    const taxIncluded = body.taxIncluded !== false

    const productData = {
      name: body.name,
      slug: generateSlug(body.name),
      description: body.description,
      price: basePrice,
      originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
      media: media,
      categoryId: parseInt(body.categoryId),
      subcategoryId: parseInt(body.subcategoryId),
      vendorId: auth.vendorId,
      status: 'pending',
      stock: parseInt(body.stock) || 0,
      specifications: body.specifications || null,
      shippingInfo: body.shippingInfo || null,
      warranty: body.warranty || null,
      taxApplied: taxApplied,
      taxRate: taxRate,
      taxIncluded: taxIncluded,
      rating: 0,
      reviews: 0,
      sold: 0,
    }

    const { data, error } = await supabase
      .from('Product')
      .insert([productData])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const product = data[0]

    if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
      const variantData = body.variants.map((v: any) => ({
        productId: product.id,
        name: v.name,
        description: v.description || null,
        originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
        price: parseFloat(v.price),
        image: v.image || null,
        stock: parseInt(v.stock) || 0,
        sku: v.sku || null,
        barcode: v.barcode || null,
      }))

      await supabase
        .from('ProductVariant')
        .insert(variantData)

      await supabase
        .from('Product')
        .update({ stock: 0 })
        .eq('id', product.id)
    }

    if (body.attributes && Array.isArray(body.attributes) && body.attributes.length > 0) {
      for (const attr of body.attributes) {
        const { data: attrData, error: attrError } = await supabase
          .from('ProductAttribute')
          .insert([{ productId: product.id, name: attr.name }])
          .select()

        if (!attrError && attrData && attrData.length > 0) {
          const attributeId = attrData[0].id
          const valueData = attr.values.map((val: string) => ({
            attributeId,
            value: val,
          }))
          await supabase
            .from('ProductAttributeValue')
            .insert(valueData)
        }
      }
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
