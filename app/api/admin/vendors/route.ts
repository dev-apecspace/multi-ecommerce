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
    const status = searchParams.get('status')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    let query = supabase
      .from('Vendor')
      .select('*', { count: 'exact' })

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
      .order('joinDate', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    
    let enrichedData = data || []
    if (data && data.length > 0) {
      enrichedData = await Promise.all(
        data.map(async (vendor: any) => {
          const { data: shopData } = await supabase
            .from('Shop')
            .select('*')
            .eq('vendorId', vendor.id)
            .maybeSingle()
          
          const shop = shopData || {}
          let shopDetail = {}
          
          if (shop?.id) {
            const { data: detailData } = await supabase
              .from('ShopDetail')
              .select('*')
              .eq('shopId', shop.id)
              .maybeSingle()
            shopDetail = detailData || {}
          }
          
          return {
            ...vendor,
            Shop: {
              ...shop,
              ShopDetail: shopDetail,
            },
          }
        })
      )
    }
    
    return NextResponse.json({
      data: enrichedData,
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
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('Vendor')
      .insert([{
        name: body.name,
        slug: generateSlug(body.name),
        status: body.status || 'pending',
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
    const vendorId = searchParams.get('id')
    const action = searchParams.get('action')
    const body = await request.json()

    if (!vendorId) return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 })

    if (action === 'lock') {
      const { data: vendorData } = await supabase
        .from('Vendor')
        .select('*')
        .eq('id', vendorId)
        .maybeSingle()

      if (!vendorData) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
      }

      const { data: shopData } = await supabase
        .from('Shop')
        .select('*')
        .eq('vendorId', vendorId)
        .maybeSingle()

      if (shopData) {
        await supabase
          .from('Shop')
          .update({
            locked: true,
            lockedReason: body.reason || '',
            lockedAt: new Date().toISOString(),
          })
          .eq('vendorId', vendorId)
      }

      return NextResponse.json({ success: true, message: 'Vendor locked successfully' })
    }

    if (action === 'unlock') {
      const { data: shopData } = await supabase
        .from('Shop')
        .select('*')
        .eq('vendorId', vendorId)
        .maybeSingle()

      if (shopData) {
        await supabase
          .from('Shop')
          .update({
            locked: false,
            lockedReason: null,
            lockedAt: null,
          })
          .eq('vendorId', vendorId)
      }

      return NextResponse.json({ success: true, message: 'Vendor unlocked successfully' })
    }

    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .select('userId')
      .eq('id', vendorId)
      .maybeSingle()

    if (vendorError || !vendorData) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('Vendor')
      .update(body)
      .eq('id', vendorId)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (body.status && vendorData.userId) {
      let userStatus = 'active'
      if (body.status === 'approved') {
        userStatus = 'active'
      } else if (body.status === 'rejected') {
        userStatus = 'inactive'
      } else if (body.status === 'pending') {
        userStatus = 'pending'
      }

      await supabase
        .from('User')
        .update({ status: userStatus })
        .eq('id', vendorData.userId)
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('id')

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('Vendor')
      .delete()
      .eq('id', vendorId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Vendor deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
