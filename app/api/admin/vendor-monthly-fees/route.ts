import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const settledStatuses = ['delivered', 'completed']
const validMonth = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-01$/.test(value)
const isFeeEligible = (order: any) => settledStatuses.includes(order.status) || (['bank', 'wallet'].includes(order.paymentMethod) && order.paymentStatus === 'paid')

async function currentFee(vendorId: number, billingMonth: string) {
  const end = new Date(Date.UTC(+billingMonth.slice(0, 4), +billingMonth.slice(5, 7), 1)).toISOString().slice(0, 10)
  const [configRes, ordersRes] = await Promise.all([
    supabase.from('VendorMonthlyFeeConfig').select('*').eq('vendorId', vendorId).maybeSingle(),
    supabase.from('Order').select('total,status,paymentMethod,paymentStatus').eq('vendorId', vendorId).gte('createdAt', billingMonth).lt('createdAt', end),
  ])
  if (configRes.error || ordersRes.error) throw new Error(configRes.error?.message || ordersRes.error?.message)
  const config = configRes.data || { feeType: 'fixed', fixedMonthlyFee: 0, revenueFeePercent: 0 }
  const settledRevenue = (ordersRes.data || []).filter(isFeeEligible).reduce((sum: number, order: any) => sum + Number(order.total || 0), 0)
  const fixedFee = Number(config.fixedMonthlyFee || 0)
  const revenueFeePercent = Number(config.revenueFeePercent || 0)
  const percentageFee = config.feeType === 'percentage' ? settledRevenue * revenueFeePercent / 100 : 0
  return { feeType: config.feeType, settledRevenue, fixedFee, revenueFeePercent, percentageFee, totalFee: config.feeType === 'fixed' ? fixedFee : percentageFee }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request); if (!isAdmin(auth)) return unauthorizedResponse()
  const params = new URL(request.url).searchParams; const vendorId = Number(params.get('vendorId'))
  if (params.get('history') === 'true' && Number.isInteger(vendorId) && vendorId > 0) {
    const month = params.get('month')
    let query = supabase.from('VendorMonthlyFee').select('billingMonth,totalFee,collectedAmount,status').eq('vendorId', vendorId).order('billingMonth', { ascending: false })
    if (month && /^\d{4}-\d{2}$/.test(month)) query = query.eq('billingMonth', `${month}-01`)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    const { data: allFees, error: debtError } = await supabase.from('VendorMonthlyFee').select('billingMonth,totalFee,collectedAmount').eq('vendorId', vendorId)
    if (debtError) return NextResponse.json({ error: debtError.message }, { status: 400 })
    // A fee record is only persisted after collection. Always synthesize the selected/current
    // period from live orders so newly confirmed orders are visible before the first collection.
    const targetMonth = month && /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : `${new Date().toISOString().slice(0, 7)}-01`
    const liveFee = await currentFee(vendorId, targetMonth)
    const savedItem = (data || []).find((fee: any) => fee.billingMonth === targetMonth)
    const collectedAmount = Number(savedItem?.collectedAmount || 0)
    const status = liveFee.totalFee - collectedAmount <= 0 ? 'collected' : collectedAmount > 0 ? 'partially_collected' : 'uncollected'
    const liveItem = { billingMonth: targetMonth, totalFee: liveFee.totalFee, collectedAmount, status }
    const items = [...(data || []).filter((fee: any) => fee.billingMonth !== targetMonth), liveItem].map((fee: any) => {
      const totalFee = Number(fee.totalFee || 0); const collected = Number(fee.collectedAmount || 0)
      return { ...fee, status: totalFee - collected <= 0 ? 'collected' : collected > 0 ? 'partially_collected' : 'uncollected' }
    }).sort((a: any, b: any) => String(b.billingMonth).localeCompare(String(a.billingMonth)))
    const savedDebtExcludingTarget = (allFees || []).filter((fee: any) => fee.billingMonth !== targetMonth).reduce((sum: number, fee: any) => sum + Math.max(0, Number(fee.totalFee || 0) - Number(fee.collectedAmount || 0)), 0)
    const totalDebt = savedDebtExcludingTarget + Math.max(0, liveFee.totalFee - collectedAmount)
    return NextResponse.json({ items, totalDebt })
  }
  if (Number.isInteger(vendorId) && vendorId > 0) {
    const { data, error } = await supabase.from('VendorMonthlyFeeConfig').select('*').eq('vendorId', vendorId).maybeSingle()
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ config: data || { vendorId, feeType: 'fixed', fixedMonthlyFee: 0, revenueFeePercent: 0 } })
  }
  const month = params.get('month') || new Date().toISOString().slice(0, 7); const start = `${month}-01`
  const end = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 1)).toISOString().slice(0, 10)
  const [vendors, configs, orders, records] = await Promise.all([
    supabase.from('Vendor').select('id,name').eq('status', 'approved').order('name'), supabase.from('VendorMonthlyFeeConfig').select('*'),
    supabase.from('Order').select('vendorId,total,status,paymentMethod,paymentStatus').gte('createdAt', start).lt('createdAt', end), supabase.from('VendorMonthlyFee').select('vendorId,collectedAmount').eq('billingMonth', start),
  ])
  const error = vendors.error || configs.error || orders.error || records.error; if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const configByVendor = new Map((configs.data || []).map((x: any) => [x.vendorId, x])); const recordByVendor = new Map((records.data || []).map((x: any) => [x.vendorId, x]))
  const revenue = new Map<number, number>(); for (const order of (orders.data || []).filter(isFeeEligible)) revenue.set(order.vendorId, (revenue.get(order.vendorId) || 0) + Number(order.total || 0))
  const items = (vendors.data || []).map((vendor: any) => { const config = configByVendor.get(vendor.id) || { feeType: 'fixed', fixedMonthlyFee: 0, revenueFeePercent: 0 }; const settledRevenue = revenue.get(vendor.id) || 0; const fixedFee = Number(config.fixedMonthlyFee || 0); const revenueFeePercent = Number(config.revenueFeePercent || 0); const percentageFee = config.feeType === 'percentage' ? settledRevenue * revenueFeePercent / 100 : 0; const totalFee = config.feeType === 'fixed' ? fixedFee : percentageFee; const collectedAmount = Number(recordByVendor.get(vendor.id)?.collectedAmount || 0); const remainingAmount = Math.max(0, totalFee - collectedAmount); const collectionStatus = remainingAmount === 0 ? 'collected' : collectedAmount > 0 ? 'partially_collected' : 'uncollected'; return { vendorId: vendor.id, vendorName: vendor.name, settledRevenue, feeType: config.feeType, fixedFee, revenueFeePercent, percentageFee, totalFee, collectedAmount, remainingAmount, collectionStatus } })
  return NextResponse.json({ month, items })
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthFromRequest(request); if (!isAdmin(auth)) return unauthorizedResponse(); const { vendorId, feeType, fixedMonthlyFee, revenueFeePercent } = await request.json()
  if (!Number.isInteger(vendorId) || !['fixed', 'percentage'].includes(feeType) || !Number.isFinite(fixedMonthlyFee) || !Number.isFinite(revenueFeePercent) || fixedMonthlyFee < 0 || revenueFeePercent < 0 || revenueFeePercent > 100) return NextResponse.json({ error: 'Cấu hình phí không hợp lệ.' }, { status: 400 })
  const config = { vendorId, feeType, fixedMonthlyFee: feeType === 'fixed' ? fixedMonthlyFee : 0, revenueFeePercent: feeType === 'percentage' ? revenueFeePercent : 0, effectiveFrom: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString() }
  const { error } = await supabase.from('VendorMonthlyFeeConfig').upsert(config)
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true, config })
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthFromRequest(request); if (!isAdmin(auth)) return unauthorizedResponse(); const { vendorId, billingMonth, amount } = await request.json(); const payment = Number(amount)
  if (!Number.isInteger(vendorId) || !validMonth(billingMonth) || !Number.isFinite(payment) || payment <= 0) return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
  try { const [fee, record] = await Promise.all([currentFee(vendorId, billingMonth), supabase.from('VendorMonthlyFee').select('collectedAmount').eq('vendorId', vendorId).eq('billingMonth', billingMonth).maybeSingle()]); if (record.error) return NextResponse.json({ error: record.error.message }, { status: 400 }); const oldAmount = Number(record.data?.collectedAmount || 0); const remaining = Math.max(0, fee.totalFee - oldAmount); if (payment > remaining) return NextResponse.json({ error: 'Số tiền thu không được vượt quá số tiền còn phải thu.' }, { status: 400 }); const collectedAmount = oldAmount + payment; const status = fee.totalFee - collectedAmount <= 0 ? 'collected' : 'partially_collected'; const { error } = await supabase.from('VendorMonthlyFee').upsert({ vendorId, billingMonth, ...fee, collectedAmount, status, updatedAt: new Date().toISOString() }, { onConflict: 'vendorId,billingMonth' }); return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể cập nhật thu phí.' }, { status: 400 }) }
}
