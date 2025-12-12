import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { generateSlug } from '@/lib/utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    let query = supabase
      .from('SubCategory')
      .select('*, Category(id, name, slug)', { count: 'exact' })

    if (categoryId) {
      query = query.eq('categoryId', parseInt(categoryId))
    }

    const { data, error, count } = await query
      .order('name')
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    let subcategoriesWithCount = data || []
    if (data && data.length > 0) {
      subcategoriesWithCount = await Promise.all(
        data.map(async (subcat: any) => {
          const { data: productsData } = await supabase
            .from('Product')
            .select('id')
            .eq('subcategoryId', subcat.id)

          return {
            ...subcat,
            productsCount: productsData?.length || 0,
          }
        })
      )
    }

    return NextResponse.json({
      data: subcategoriesWithCount,
      pagination: { total: count, limit, offset },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || !body.categoryId) {
      return NextResponse.json(
        { error: 'Subcategory name and category ID are required' },
        { status: 400 }
      )
    }

    const slug = generateSlug(body.name)

    const { data, error } = await supabase
      .from('SubCategory')
      .insert([{
        name: body.name,
        slug: slug,
        categoryId: parseInt(body.categoryId),
      }])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subcategoryId = searchParams.get('id')
    const body = await request.json()

    if (!subcategoryId) {
      return NextResponse.json({ error: 'Subcategory ID is required' }, { status: 400 })
    }

    if (!body.name) {
      return NextResponse.json({ error: 'Subcategory name is required' }, { status: 400 })
    }

    const updateData: any = {
      name: body.name,
      updatedAt: new Date().toISOString(),
    }

    if (body.slug) {
      updateData.slug = body.slug
    }

    if (body.categoryId) {
      updateData.categoryId = parseInt(body.categoryId)
    }

    const { data, error } = await supabase
      .from('SubCategory')
      .update(updateData)
      .eq('id', subcategoryId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subcategoryId = searchParams.get('id')

    if (!subcategoryId) {
      return NextResponse.json({ error: 'Subcategory ID is required' }, { status: 400 })
    }

    const { data: productsData } = await supabase
      .from('Product')
      .select('id')
      .eq('subcategoryId', subcategoryId)
      .limit(1)

    if (productsData && productsData.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete subcategory with existing products' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('SubCategory')
      .delete()
      .eq('id', subcategoryId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Subcategory deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
