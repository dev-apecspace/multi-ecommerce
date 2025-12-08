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
      .select('*, Category(name, slug), SubCategory(name, slug), Vendor(name, status, slug), ProductVariant(*), ProductAttribute(id, name, ProductAttributeValue(id, value))', { count: 'exact' })

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

    const filteredData = data?.filter((product: any) => {
      if (showPending) {
        return true
      }
      return product.Vendor?.status === 'approved'
    }) || []

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
