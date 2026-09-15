import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const defaults = { codEnabled: true, accountEnabled: true, walletEnabled: false, standardShippingFee: 10000, expressShippingFee: 30000, paymentMethods: [{ id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', enabled: true }, { id: 'bank', label: 'Tài khoản', enabled: true }, { id: 'wallet', label: 'Ví điện tử', enabled: false }], shippingMethods: [{ id: 'standard', label: 'Giao tiêu chuẩn 1-3 ngày', enabled: true, fee: 10000 }, { id: 'express', label: 'Giao nhanh 2-3 giờ', enabled: true, fee: 30000 }] }

export async function GET() {
  const { data, error } = await supabase.from('AdminSettings').select('value').eq('key', 'system').maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  try {
    const saved = data?.value ? JSON.parse(data.value) : {}
    const paymentMethods = Array.isArray(saved.paymentMethods) ? saved.paymentMethods : defaults.paymentMethods
    const shippingMethods = Array.isArray(saved.shippingMethods) ? saved.shippingMethods : defaults.shippingMethods
    return NextResponse.json({ settings: { ...defaults, ...saved, accountEnabled: saved.accountEnabled ?? saved.bankTransferEnabled ?? defaults.accountEnabled, walletEnabled: saved.walletEnabled ?? saved.vnpayEnabled ?? defaults.walletEnabled, paymentMethods, shippingMethods } })
  } catch { return NextResponse.json({ settings: defaults }) }
}
