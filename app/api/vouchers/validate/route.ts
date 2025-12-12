import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, vendorId, orderValue, userId } = body

    if (!code || !vendorId || !orderValue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: voucher, error } = await supabase
      .from('Voucher')
      .select()
      .eq('code', code.toUpperCase())
      .eq('vendorId', vendorId)
      .eq('status', 'approved')
      .single()

    if (error || !voucher) {
      return NextResponse.json({ error: 'Voucher không tìm thấy hoặc không hợp lệ' }, { status: 404 })
    }

    const now = new Date()
    const startDate = new Date(voucher.startDate)
    const endDate = new Date(voucher.endDate)

    if (now < startDate) {
      return NextResponse.json({ error: 'Voucher chưa bắt đầu' }, { status: 400 })
    }

    if (now > endDate) {
      return NextResponse.json({ error: 'Voucher đã hết hạn' }, { status: 400 })
    }

    if (!voucher.active) {
      return NextResponse.json({ error: 'Voucher không hoạt động' }, { status: 400 })
    }

    if (orderValue < voucher.minOrderValue) {
      return NextResponse.json(
        { error: `Giá trị đơn hàng tối thiểu: ${voucher.minOrderValue.toLocaleString('vi-VN')}₫` },
        { status: 400 }
      )
    }

    if (voucher.totalUsageLimit && voucher.usageCount >= voucher.totalUsageLimit) {
      return NextResponse.json({ error: 'Voucher đã hết lượt sử dụng' }, { status: 400 })
    }

    if (userId) {
      const { data: usageData } = await supabase
        .from('VoucherUsage')
        .select()
        .eq('voucherId', voucher.id)
        .eq('userId', userId)

      const usageCount = usageData?.length || 0
      if (usageCount >= voucher.maxUsagePerUser) {
        return NextResponse.json(
          { error: `Bạn đã dùng voucher này ${voucher.maxUsagePerUser} lần` },
          { status: 400 }
        )
      }
    }

    let discountAmount = 0
    if (voucher.discountType === 'percentage') {
      discountAmount = (orderValue * voucher.discountValue) / 100
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount
      }
    } else {
      discountAmount = voucher.discountValue
    }

    return NextResponse.json({
      voucherId: voucher.id,
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discountAmount: Math.round(discountAmount),
      description: voucher.description,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
