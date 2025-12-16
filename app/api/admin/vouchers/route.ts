import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isAdmin(auth)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    let query = supabase
      .from('Voucher')
      .select('*, Vendor(name, id, userId)', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data,
      pagination: {
        total: count,
        limit,
        page,
        totalPages,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isAdmin(auth)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Voucher ID is required' }, { status: 400 })
    }

    const body = await request.json()

    const { data: existingVoucher, error: fetchError } = await supabase
      .from('Voucher')
      .select()
      .eq('id', parseInt(id))
      .single()

    if (fetchError || !existingVoucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    }

    const updateData: any = {
      status: body.status,
      approvedBy: auth.id,
      updatedAt: new Date(),
    }

    if (body.status === 'approved') {
      updateData.approvedAt = new Date()
      updateData.active = true
    } else if (body.status === 'rejected') {
      updateData.rejectionReason = body.rejectionReason || null
    }

    const { data, error } = await supabase
      .from('Voucher')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
