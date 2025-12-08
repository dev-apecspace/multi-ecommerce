import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getProductWithVariants(productId: number, vendorId: number) {
  try {
    const { data: product, error: productError } = await supabase
      .from('Product')
      .select(`*, 
        Category(name, slug), 
        SubCategory(name, slug), 
        Vendor(name)
      `)
      .eq('id', productId)
      .eq('vendorId', vendorId)
      .single()

    if (productError) {
      console.error('Error fetching product:', productError)
      throw productError
    }

    const { data: variants = [], error: variantsError } = await supabase
      .from('ProductVariant')
      .select('*')
      .eq('productId', productId)

    if (variantsError) {
      console.error('Error fetching variants:', variantsError)
    }

    const media = product.media || []
    const productImage = media.map((item: any, index: number) => ({
      id: index,
      image: item.url,
      mediaType: item.type || 'image',
      isMain: item.isMain || false,
      order: item.order || index,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    return {
      ...product,
      ProductVariant: variants,
      ProductImage: productImage,
    }
  } catch (error) {
    console.error('Error in getProductWithVariants:', error)
    throw error
  }
}
