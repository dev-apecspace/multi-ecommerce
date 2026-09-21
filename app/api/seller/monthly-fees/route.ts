import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const eligible = (order: any) => ['delivered', 'completed'].includes(order.status) || (['bank', 'wallet'].includes(order.paymentMethod) && order.paymentStatus === 'paid')

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth || !isVendor(auth)) return unauthorizedResponse()
  const month = new URL(request.url).searchParams.get('month') || new Date().toISOString().slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: 'Kỳ phí không hợp lệ.' }, { status: 400 })
  const billingMonth = `${month}-01`; const end = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 1)).toISOString()
  const [configRes, ordersRes, recordsRes] = await Promise.all([
    supabase.from('VendorMonthlyFeeConfig').select('*').eq('vendorId', auth.vendorId).maybeSingle(),
    supabase.from('Order').select('total,status,paymentMethod,paymentStatus').eq('vendorId', auth.vendorId).gte('createdAt', billingMonth).lt('createdAt', end),
    supabase.from('VendorMonthlyFee').select('billingMonth,totalFee,collectedAmount,status').eq('vendorId', auth.vendorId).order('billingMonth', { ascending: false }),
  ])
  const error = configRes.error || ordersRes.error || recordsRes.error; if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const config = configRes.data || { feeType: 'fixed', fixedMonthlyFee: 0, revenueFeePercent: 0 }
  const revenue = (ordersRes.data || []).filter(eligible).reduce((sum: number, order: any) => sum + Number(order.total || 0), 0)
  const due = config.feeType === 'percentage' ? revenue * Number(config.revenueFeePercent || 0) / 100 : Number(config.fixedMonthlyFee || 0)
  const savedCurrent = (recordsRes.data || []).find((record: any) => record.billingMonth === billingMonth)
  const collectedAmount = Number(savedCurrent?.collectedAmount || 0); const remainingAmount = Math.max(0, due - collectedAmount)
  const status = remainingAmount === 0 ? 'collected' : collectedAmount > 0 ? 'partially_collected' : 'uncollected'
  const current = { billingMonth, totalFee: due, collectedAmount, remainingAmount, status }
  const history = [...(recordsRes.data || []).filter((record: any) => record.billingMonth !== billingMonth), current].map((record: any) => ({ ...record, remainingAmount: Math.max(0, Number(record.totalFee || 0) - Number(record.collectedAmount || 0)), status: Number(record.totalFee || 0) - Number(record.collectedAmount || 0) <= 0 ? 'collected' : Number(record.collectedAmount || 0) > 0 ? 'partially_collected' : 'uncollected' })).sort((a: any, b: any) => String(b.billingMonth).localeCompare(String(a.billingMonth)))
  const totalDebt = history.reduce((sum: number, record: any) => sum + Number(record.remainingAmount || 0), 0)
  return NextResponse.json({ month, config: { feeType: config.feeType, rate: config.feeType === 'percentage' ? Number(config.revenueFeePercent || 0) : Number(config.fixedMonthlyFee || 0) }, current, totalDebt, history })
}
