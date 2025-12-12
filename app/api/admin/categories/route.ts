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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const { data, error, count } = await supabase
      .from('Category')
      .select('*', { count: 'exact' })
      .order('name')
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    let categoriesWithCount = data || []
    if (data && data.length > 0) {
      categoriesWithCount = await Promise.all(
        data.map(async (category: any) => {
          const { data: subcatsData } = await supabase
            .from('SubCategory')
            .select('id')
            .eq('categoryId', category.id)

          const { data: productsData } = await supabase
            .from('Product')
            .select('id')
            .eq('categoryId', category.id)

          return {
            ...category,
            subcategoriesCount: subcatsData?.length || 0,
            productsCount: productsData?.length || 0,
          }
        })
      )
    }

    return NextResponse.json({
      data: categoriesWithCount,
      pagination: { total: count, limit, offset },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const slug = generateSlug(body.name)

    if (body.categoryId) {
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
    }

    const { data, error } = await supabase
      .from('Category')
      .insert([{
        name: body.name,
        slug: slug,
        icon: body.icon || null,
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
    const categoryId = searchParams.get('id')
    const body = await request.json()

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    if (!body.name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const updateData: any = {
      name: body.name,
      icon: body.icon || null,
      updatedAt: new Date().toISOString(),
    }

    if (body.slug) {
      updateData.slug = body.slug
    }

    const { data, error } = await supabase
      .from('Category')
      .update(updateData)
      .eq('id', categoryId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const { data: productsData } = await supabase
      .from('Product')
      .select('id')
      .eq('categoryId', categoryId)
      .limit(1)

    if (productsData && productsData.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing products' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('Category')
      .delete()
      .eq('id', categoryId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
