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

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const vendorId = auth.vendorId

    let query = supabase
      .from('Voucher')
      .select('*', { count: 'exact' })
      .eq('vendorId', vendorId)

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

    return NextResponse.json({
      data,
      pagination: {
        total: count,
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
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const body = await request.json()

    const voucherData = {
      code: body.code.toUpperCase(),
      vendorId: auth.vendorId,
      description: body.description || null,
      type: body.type,
      discountType: body.discountType,
      discountValue: parseFloat(body.discountValue),
      maxDiscount: body.maxDiscount ? parseFloat(body.maxDiscount) : null,
      minOrderValue: body.minOrderValue ? parseFloat(body.minOrderValue) : 0,
      maxUsagePerUser: body.maxUsagePerUser ? parseInt(body.maxUsagePerUser) : 1,
      totalUsageLimit: body.totalUsageLimit ? parseInt(body.totalUsageLimit) : null,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      active: true,
      status: 'pending',
    }

    const { data, error } = await supabase
      .from('Voucher')
      .insert([voucherData])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const voucher = data[0]

    if (body.targetProducts && Array.isArray(body.targetProducts) && body.targetProducts.length > 0) {
      const targetData = body.targetProducts.map((productId: number) => ({
        voucherId: voucher.id,
        productId,
      }))

      await supabase
        .from('VoucherTargetProduct')
        .insert(targetData)
    }

    return NextResponse.json(voucher, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) {
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

    if (existingVoucher.vendorId !== auth.vendorId) {
      return unauthorizedResponse()
    }

    const updateData: any = {}
    if (body.description !== undefined) updateData.description = body.description
    if (body.discountValue !== undefined) updateData.discountValue = parseFloat(body.discountValue)
    if (body.maxDiscount !== undefined) updateData.maxDiscount = body.maxDiscount ? parseFloat(body.maxDiscount) : null
    if (body.minOrderValue !== undefined) updateData.minOrderValue = parseFloat(body.minOrderValue)
    if (body.maxUsagePerUser !== undefined) updateData.maxUsagePerUser = parseInt(body.maxUsagePerUser)
    if (body.totalUsageLimit !== undefined) updateData.totalUsageLimit = body.totalUsageLimit ? parseInt(body.totalUsageLimit) : null
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate)
    if (body.active !== undefined) updateData.active = body.active

    updateData.updatedAt = new Date()

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

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Voucher ID is required' }, { status: 400 })
    }

    const { data: existingVoucher, error: fetchError } = await supabase
      .from('Voucher')
      .select()
      .eq('id', parseInt(id))
      .single()

    if (fetchError || !existingVoucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    }

    if (existingVoucher.vendorId !== auth.vendorId) {
      return unauthorizedResponse()
    }

    const { error } = await supabase
      .from('Voucher')
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Voucher deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
