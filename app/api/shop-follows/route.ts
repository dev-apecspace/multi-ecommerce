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
    const vendorId = searchParams.get('vendorId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (vendorId) {
      const { data, error } = await supabase
        .from('ShopFollow')
        .select('*')
        .eq('userId', parseInt(userId))
        .eq('vendorId', parseInt(vendorId))
        .single()

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ isFollowing: !!data }, { status: 200 })
    }

    const { data, error } = await supabase
      .from('ShopFollow')
      .select('*, Vendor(id, name, slug, logo, rating, followers)')
      .eq('userId', parseInt(userId))
      .order('createdAt', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vendorId } = body

    if (!userId || !vendorId) {
      return NextResponse.json({ error: 'User ID and Vendor ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ShopFollow')
      .insert([{ userId, vendorId }])
      .select('*')

    if (error) {
      if (error.message.includes('duplicate')) {
        const { count } = await supabase.from('ShopFollow').select('id', { count: 'exact', head: true }).eq('vendorId', vendorId)
        await supabase.from('Vendor').update({ followers: count || 0 }).eq('id', vendorId)
        return NextResponse.json({ success: true, alreadyFollowing: true, followers: count || 0 }, { status: 200 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const { count } = await supabase
      .from('ShopFollow')
      .select('id', { count: 'exact', head: true })
      .eq('vendorId', vendorId)

    await supabase
      .from('Vendor')
      .update({ followers: count })
      .eq('id', vendorId)

    return NextResponse.json({ success: true, message: 'Following shop', followers: count || 0 }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const vendorId = searchParams.get('vendorId')

    if (!userId || !vendorId) {
      return NextResponse.json({ error: 'User ID and Vendor ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('ShopFollow')
      .delete()
      .eq('userId', parseInt(userId))
      .eq('vendorId', parseInt(vendorId))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const { count } = await supabase
      .from('ShopFollow')
      .select('id', { count: 'exact', head: true })
      .eq('vendorId', parseInt(vendorId))

    await supabase
      .from('Vendor')
      .update({ followers: count })
      .eq('id', parseInt(vendorId))

    return NextResponse.json({ success: true, message: 'Unfollowed shop', followers: count || 0 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
