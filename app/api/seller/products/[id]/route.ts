import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'
import { getProductWithVariants } from '@/lib/product-query'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const productId = parseInt(id)

    const product = await getProductWithVariants(productId, auth.vendorId!)
    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const productId = parseInt(id)
    const body = await request.json()

    const { data: existing } = await supabase
      .from('Product')
      .select('id')
      .eq('id', productId)
      .eq('vendorId', auth.vendorId)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      )
    }

    const updateData: Record<string, any> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = parseFloat(body.price)
    if (body.originalPrice !== undefined) updateData.originalPrice = body.originalPrice ? parseFloat(body.originalPrice) : null
    if (body.categoryId !== undefined) updateData.categoryId = parseInt(body.categoryId)
    if (body.subcategoryId !== undefined) updateData.subcategoryId = parseInt(body.subcategoryId)
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock)
    if (body.specifications !== undefined) updateData.specifications = body.specifications
    if (body.shippingInfo !== undefined) updateData.shippingInfo = body.shippingInfo
    if (body.warranty !== undefined) updateData.warranty = body.warranty

    if (body.images && Array.isArray(body.images)) {
      const mediaArray = body.images
        .filter((img: any) => img.image || img.url)
        .map((img: any, index: number) => ({
          url: img.image || img.url,
          type: img.mediaType || 'image',
          isMain: img.isMain || false,
          order: index,
        }))
      
      updateData.media = mediaArray
    }

    const { data, error } = await supabase
      .from('Product')
      .update(updateData)
      .eq('id', productId)
      .select()

    if (error) {
      console.error('Product update error:', { error, updateData })
      return NextResponse.json({ error: error.message, details: error }, { status: 400 })
    }

    if (body.variants && Array.isArray(body.variants)) {
      const variantsToDelete = body.variants.filter((v: any) => v.deleted)
      const variantsToUpsert = body.variants.filter((v: any) => !v.deleted)

      if (variantsToDelete.length > 0) {
        const idsToDelete = variantsToDelete.map((v: any) => v.id).filter(Boolean)
        if (idsToDelete.length > 0) {
          await supabase
            .from('ProductVariant')
            .delete()
            .in('id', idsToDelete)
        }
      }

      if (variantsToUpsert.length > 0) {
        const variantData = variantsToUpsert.map((v: any) => ({
          id: v.id || undefined,
          productId,
          name: v.name,
          description: v.description || null,
          originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
          price: parseFloat(v.price),
          image: v.image || null,
          stock: parseInt(v.stock) || 0,
        }))

        for (const variant of variantData) {
          if (variant.id) {
            await supabase
              .from('ProductVariant')
              .update(variant)
              .eq('id', variant.id)
          } else {
            const { id, ...newVariant } = variant
            await supabase
              .from('ProductVariant')
              .insert([newVariant])
          }
        }
      }
    }

    const updatedProduct = await getProductWithVariants(productId, auth.vendorId!)
    return NextResponse.json(updatedProduct)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const productId = parseInt(id)

    const { data: existing } = await supabase
      .from('Product')
      .select('id')
      .eq('id', productId)
      .eq('vendorId', auth.vendorId)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('Product')
      .delete()
      .eq('id', productId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
