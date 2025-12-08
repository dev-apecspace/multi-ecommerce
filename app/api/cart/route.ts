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
      .from('CartItem')
      .select(`
        id,
        quantity,
        variantId,
        Product!inner(
          id,
          name,
          price,
          originalPrice,
          stock,
          vendorId,
          Vendor!inner(id, name)
        ),
        ProductVariant(id, name, sku, barcode, image)
      `)
      .eq('userId', parseInt(userId))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId, quantity, variantId } = body

    if (!userId || !productId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('CartItem')
      .upsert(
        { 
          userId: parseInt(userId), 
          productId: parseInt(productId), 
          quantity: parseInt(quantity),
          variantId: variantId ? parseInt(variantId) : null
        },
        { onConflict: 'userId,productId,variantId' }
      )
      .select(`
        id,
        quantity,
        variantId,
        Product!inner(id, name, price, stock),
        ProductVariant(id, name, image)
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: data[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { cartItemId, quantity } = body

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (quantity < 1) {
      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('CartItem')
      .update({ quantity: parseInt(quantity) })
      .eq('id', parseInt(cartItemId))
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cartItemId = searchParams.get('id')

    if (!cartItemId) {
      return NextResponse.json({ error: 'Cart item ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('CartItem')
      .delete()
      .eq('id', parseInt(cartItemId))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
