import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const settledStatuses = ['delivered', 'completed']

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!isAdmin(auth)) return unauthorizedResponse()

  const searchParams = new URL(request.url).searchParams
  const vendorId = Number(searchParams.get('vendorId'))
  if (Number.isInteger(vendorId) && vendorId > 0) {
    const { data, error } = await supabase.from('VendorMonthlyFeeConfig').select('*').eq('vendorId', vendorId).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ config: data || { vendorId, feeType: 'fixed', fixedMonthlyFee: 0, revenueFeePercent: 0 } })
  }
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)
  const start = `${month}-01`
  const end = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)).toISOString().slice(0, 10)
  const [vendorsRes, configsRes, ordersRes, feeRecordsRes] = await Promise.all([
    supabase.from('Vendor').select('id, name, status').eq('status', 'approved').order('name'),
    supabase.from('VendorMonthlyFeeConfig').select('*'),
    supabase.from('Order').select('vendorId, total, status').in('status', settledStatuses).gte('createdAt', start).lt('createdAt', end),
    supabase.from('VendorMonthlyFee').select('vendorId, status').eq('billingMonth', start),
  ])
  if (vendorsRes.error || configsRes.error || ordersRes.error || feeRecordsRes.error) {
    return NextResponse.json({ error: vendorsRes.error?.message || configsRes.error?.message || ordersRes.error?.message || feeRecordsRes.error?.message }, { status: 400 })
  }
  const configs = new Map((configsRes.data || []).map((config: any) => [config.vendorId, config]))
  const feeRecords = new Map((feeRecordsRes.data || []).map((record: any) => [record.vendorId, record]))
  const revenueByVendor = new Map<number, number>()
  for (const order of ordersRes.data || []) revenueByVendor.set(order.vendorId, (revenueByVendor.get(order.vendorId) || 0) + Number(order.total || 0))
  const items = (vendorsRes.data || []).map((vendor: any) => {
    const config = configs.get(vendor.id) || { feeType: 'fixed', fixedMonthlyFee: 0, revenueFeePercent: 0 }
    const settledRevenue = revenueByVendor.get(vendor.id) || 0
    const fixedFee = Number(config.fixedMonthlyFee || 0)
    const revenueFeePercent = Number(config.revenueFeePercent || 0)
    const percentageFee = config.feeType === 'percentage' ? settledRevenue * revenueFeePercent / 100 : 0
    return { vendorId: vendor.id, vendorName: vendor.name, settledRevenue, feeType: config.feeType, fixedFee, revenueFeePercent, percentageFee, totalFee: config.feeType === 'fixed' ? fixedFee : percentageFee, collectionStatus: feeRecords.get(vendor.id)?.status || 'uncollected' }
  })
  return NextResponse.json({ month, items })
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!isAdmin(auth)) return unauthorizedResponse()
  const { vendorId, feeType, fixedMonthlyFee, revenueFeePercent } = await request.json()
  if (!Number.isInteger(vendorId) || !['fixed', 'percentage'].includes(feeType) || !Number.isFinite(fixedMonthlyFee) || !Number.isFinite(revenueFeePercent) || fixedMonthlyFee < 0 || revenueFeePercent < 0 || revenueFeePercent > 100) {
    return NextResponse.json({ error: 'Cấu hình phí không hợp lệ.' }, { status: 400 })
  }
  const { error } = await supabase.from('VendorMonthlyFeeConfig').upsert({ vendorId, feeType, fixedMonthlyFee: feeType === 'fixed' ? fixedMonthlyFee : 0, revenueFeePercent: feeType === 'percentage' ? revenueFeePercent : 0, effectiveFrom: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!isAdmin(auth)) return unauthorizedResponse()
  const { vendorId, billingMonth, status, feeType, settledRevenue, fixedFee, revenueFeePercent, totalFee } = await request.json()
  if (!Number.isInteger(vendorId) || !/^\d{4}-\d{2}-01$/.test(billingMonth) || !['uncollected', 'collected'].includes(status) || !['fixed', 'percentage'].includes(feeType)) return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
  const percentageFee = feeType === 'percentage' ? Number(totalFee || 0) : 0
  const { error } = await supabase.from('VendorMonthlyFee').upsert({ vendorId, billingMonth, status, feeType, settledRevenue, fixedFee, revenueFeePercent, percentageFee, totalFee }, { onConflict: 'vendorId,billingMonth' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
