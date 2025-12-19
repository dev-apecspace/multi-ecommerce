import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('Favorite')
      .select('*, Product(id, name, slug, price, originalPrice, media, rating, sold, stock, status, Vendor(id, name, slug, logo, rating), Category(id, name, slug))')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const formattedData = data?.map((favorite: any) => ({
      ...favorite,
      product: {
        ...favorite.Product,
        image: favorite.Product?.media?.[0]?.url || '/placeholder.svg'
      },
      isFavorited: true,
    })) || []

    return NextResponse.json(formattedData)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId } = body

    if (!userId || !productId) {
      return NextResponse.json({ error: 'User ID and Product ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('Favorite')
      .insert([{ userId, productId }])
      .select('*, Product(id, name, slug, price, originalPrice, media, rating, sold, stock, status, Vendor(id, name, slug, logo, rating), Category(id, name, slug))')

    if (error) {
      if (error.message.includes('duplicate')) {
        return NextResponse.json({ message: 'Product already in favorites' }, { status: 200 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      ...data[0],
      product: {
        ...data[0].Product,
        image: data[0].Product?.media?.[0]?.url || '/placeholder.svg'
      },
      isFavorited: true,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const productId = searchParams.get('productId')

    if (!userId || !productId) {
      return NextResponse.json({ error: 'User ID and Product ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('Favorite')
      .delete()
      .eq('userId', parseInt(userId))
      .eq('productId', parseInt(productId))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Removed from favorites' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
