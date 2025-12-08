import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)

    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const vendorId = auth.vendorId
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    let query = supabase
      .from('SellerChat')
      .select('*', { count: 'exact' })
      .eq('vendorId', vendorId)

    if (unreadOnly) query = query.eq('status', 'unread')

    const { data, error, count } = await query
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({
      data,
      pagination: { total: count, limit, offset },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)

    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { data, error } = await supabase.from('SellerChat').insert([{ ...body, vendorId: auth.vendorId }]).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    if (!id) return NextResponse.json({ error: 'Chat ID required' }, { status: 400 })

    const { data, error } = await supabase.from('SellerChat').update(body).eq('id', id).select()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
