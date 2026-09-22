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
    const vendorId = Number(searchParams.get('id'))
    if (searchParams.get('action') === 'orders' && Number.isInteger(vendorId) && vendorId > 0) {
      const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)
      if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: 'Tháng không hợp lệ.' }, { status: 400 })
      const start = `${month}-01`; const end = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 1)).toISOString()
      const { data, error } = await supabase.from('Order').select('id,orderNumber,total,status,paymentMethod,paymentStatus,paymentProofUrl,paymentSubmittedAt,paymentVerificationStatus,paymentVerificationData,paymentVerifiedAt,createdAt,User(id,name,email,phone),OrderItem(id,quantity,price,variantName,Product(id,name,media),ProductVariant(id,name,image))').eq('vendorId', vendorId).gte('createdAt', start).lt('createdAt', end).order('createdAt', { ascending: false })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      const orders = data || []
      const revenue = orders.filter((order: any) => ['delivered', 'completed'].includes(order.status) || (['bank', 'wallet'].includes(order.paymentMethod) && order.paymentStatus === 'paid')).reduce((sum: number, order: any) => sum + Number(order.total || 0), 0)
      return NextResponse.json({ month, orders, orderCount: orders.length, revenue })
    }
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabase
      .from('Vendor')
      .select('*', { count: 'exact' })

    if (Number.isInteger(vendorId) && vendorId > 0) query = query.eq('id', vendorId)
    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
      .order('joinDate', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    
    let enrichedData = data || []
    if (data && data.length > 0) {
      enrichedData = await Promise.all(
        data.map(async (vendor: any) => {
          const { data: userData } = await supabase
            .from('User')
            .select('email, phone')
            .eq('id', vendor.userId)
            .maybeSingle()
          
          const { count: productCount } = await supabase
            .from('Product')
            .select('*', { count: 'exact', head: true })
            .eq('vendorId', vendor.id)
            .eq('status', 'approved')
          
          const { data: reviews } = await supabase
            .from('ProductReview')
            .select('rating')
            .in('productId', 
              (await supabase
                .from('Product')
                .select('id')
                .eq('vendorId', vendor.id)
              ).data?.map((p: any) => p.id) || []
            )
          
          const avgRating = reviews && reviews.length > 0 
            ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0
          
          const { data: orderRows, error: orderError } = await supabase
            .from('Order')
            .select('total, status, paymentMethod, paymentStatus')
            .eq('vendorId', vendor.id)
          if (orderError) throw orderError
          const { data: monthlyFeeConfig, error: monthlyFeeConfigError } = await supabase
            .from('VendorMonthlyFeeConfig')
            .select('feeType, fixedMonthlyFee, revenueFeePercent, effectiveFrom')
            .eq('vendorId', vendor.id)
            .maybeSingle()
          if (monthlyFeeConfigError) throw monthlyFeeConfigError
          const orders = orderRows || []
          const revenue = orders.filter((order: any) => ['delivered', 'completed'].includes(order.status) || (['bank', 'wallet'].includes(order.paymentMethod) && order.paymentStatus === 'paid')).reduce((sum: number, order: any) => sum + Number(order.total || 0), 0)
          return {
            ...vendor,
            products: productCount || 0,
            rating: parseFloat(avgRating as string) || 0,
            orderCount: orders.length,
            revenue,
            monthlyFeeConfig,
            Shop: {
              ShopDetail: {
                email: userData?.email || '',
                phone: userData?.phone || '',
                address: vendor.businessAddress || '',
                taxId: vendor.taxId || '',
                businessLicense: vendor.businessLicense || '',
                bankAccount: vendor.bankAccount || '',
                bankName: vendor.bankName || '',
              },
            },
          }
        })
      )
    }
    
    const totalPages = Math.ceil((count || 0) / limit)
    
    return NextResponse.json({
      data: enrichedData,
      pagination: { total: count, limit, page, totalPages },
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

    if (action === 'fee-config') {
      const feeType = body.feeType
      const fixedMonthlyFee = Number(body.fixedMonthlyFee)
      const revenueFeePercent = Number(body.revenueFeePercent)
      const effectiveFrom = typeof body.effectiveFrom === 'string' ? body.effectiveFrom : ''
      if (!['fixed', 'percentage'].includes(feeType) || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
        return NextResponse.json({ error: 'Cấu hình phí hoặc ngày áp dụng không hợp lệ.' }, { status: 400 })
      }
      if (feeType === 'percentage' && (!Number.isFinite(revenueFeePercent) || revenueFeePercent <= 0 || revenueFeePercent > 100)) {
        return NextResponse.json({ error: 'Tỷ lệ phí phải lớn hơn 0% và không vượt quá 100%.' }, { status: 400 })
      }
      if (feeType === 'fixed' && (!Number.isFinite(fixedMonthlyFee) || fixedMonthlyFee < 0)) {
        return NextResponse.json({ error: 'Phí cố định phải từ 0 ₫ trở lên.' }, { status: 400 })
      }
      const { data, error } = await supabase
        .from('VendorMonthlyFeeConfig')
        .upsert({ vendorId: Number(vendorId), feeType, fixedMonthlyFee: feeType === 'fixed' ? fixedMonthlyFee : 0, revenueFeePercent: feeType === 'percentage' ? revenueFeePercent : 0, effectiveFrom, updatedAt: new Date().toISOString() }, { onConflict: 'vendorId' })
        .select('feeType, fixedMonthlyFee, revenueFeePercent, effectiveFrom')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ config: data })
    }

    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .select('userId')
      .eq('id', vendorId)
      .maybeSingle()

    if (vendorError || !vendorData) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    if (body.status === 'approved') {
      const { data: documents, error: documentsError } = await supabase
        .from('VendorDocument')
        .select('id, status')
        .eq('vendorId', vendorId)

      if (documentsError) return NextResponse.json({ error: documentsError.message }, { status: 400 })
      const activeDocuments = (documents || []).filter((document) => document.status !== 'rejected')
      const hasPendingDocument = activeDocuments.length === 0 || activeDocuments.some((document) => document.status !== 'approved')
      if (hasPendingDocument) {
        return NextResponse.json({ error: 'Cần duyệt toàn bộ hồ sơ hợp lệ của shop trước khi duyệt nhà bán hàng.' }, { status: 409 })
      }
      const { data: monthlyFeeConfig, error: monthlyFeeError } = await supabase
        .from('VendorMonthlyFeeConfig')
        .select('vendorId')
        .eq('vendorId', vendorId)
        .maybeSingle()
      if (monthlyFeeError) return NextResponse.json({ error: monthlyFeeError.message }, { status: 400 })
      if (!monthlyFeeConfig) {
        return NextResponse.json({ error: 'Cần cấu hình phí hợp tác hàng tháng trước khi duyệt shop.' }, { status: 409 })
      }
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
