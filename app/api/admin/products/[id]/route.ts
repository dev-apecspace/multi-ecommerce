import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    const { data: product, error: productError } = await supabase
      .from('Product')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      console.error('Product fetch error:', productError)
      return NextResponse.json({ error: 'Product not found', details: productError?.message }, { status: 404 })
    }

    const { data: category } = await supabase
      .from('Category')
      .select('id, name, slug')
      .eq('id', product.categoryId)
      .single()

    const { data: subcategory } = await supabase
      .from('SubCategory')
      .select('id, name, slug')
      .eq('id', product.subcategoryId)
      .single()

    const { data: vendor } = await supabase
      .from('Vendor')
      .select('id, name, userId')
      .eq('id', product.vendorId)
      .single()

    const { data: variants = [] } = await supabase
      .from('ProductVariant')
      .select('*')
      .eq('productId', productId)

    const { data: attributes = [] } = await supabase
      .from('ProductAttribute')
      .select('*, ProductAttributeValue(*)')
      .eq('productId', productId)

    const media = product.media || []
    const productImages = media.map((item: any, index: number) => ({
      id: index,
      url: item.url,
      type: item.type || 'image',
      isMain: item.isMain || false,
      order: item.order || index,
    }))

    return NextResponse.json({
      ...product,
      Category: category,
      SubCategory: subcategory,
      Vendor: vendor,
      ProductVariant: variants,
      ProductAttribute: attributes,
      ProductImage: productImages,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    const body = await request.json()
    const { status, reviewNotes } = body

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    }

    if (status === 'rejected' && reviewNotes) {
      updateData.reviewNotes = reviewNotes
    }

    const { data, error } = await supabase
      .from('Product')
      .update(updateData)
      .eq('id', productId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
