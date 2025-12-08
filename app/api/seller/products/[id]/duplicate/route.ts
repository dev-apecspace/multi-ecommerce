import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
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

    const { data: originalProduct, error: fetchError } = await supabase
      .from('Product')
      .select('*')
      .eq('id', productId)
      .eq('vendorId', auth.vendorId)
      .single()

    if (fetchError || !originalProduct) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      )
    }

    const duplicatedProduct = {
      name: `${originalProduct.name} (Bản sao)`,
      description: originalProduct.description,
      price: originalProduct.price,
      originalPrice: originalProduct.originalPrice,
      image: originalProduct.image,
      categoryId: originalProduct.categoryId,
      subcategoryId: originalProduct.subcategoryId,
      vendorId: auth.vendorId,
      status: 'pending',
      stock: originalProduct.stock,
      specifications: originalProduct.specifications,
      shippingInfo: originalProduct.shippingInfo,
      warranty: originalProduct.warranty,
      rating: 0,
      reviews: 0,
      sold: 0,
    }

    const { data, error } = await supabase
      .from('Product')
      .insert([duplicatedProduct])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
