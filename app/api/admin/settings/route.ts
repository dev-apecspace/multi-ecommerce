import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const SETTINGS_KEY = 'system'
export type Method = { id: string; label: string; enabled: boolean; fee?: number }
export type SystemSettings = { storeName: string; supportEmail: string; supportPhone: string; codEnabled: boolean; accountEnabled: boolean; walletEnabled: boolean; standardShippingFee: number; expressShippingFee: number; paymentMethods: Method[]; shippingMethods: Method[] }
const defaults: SystemSettings = { storeName: 'Sàn TMĐT APECSPACE', supportEmail: 'support@sandtmdt.com', supportPhone: '1900-1234', codEnabled: true, accountEnabled: true, walletEnabled: false, standardShippingFee: 10000, expressShippingFee: 30000, paymentMethods: [{ id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', enabled: true }, { id: 'bank', label: 'Tài khoản', enabled: true }, { id: 'wallet', label: 'Ví điện tử', enabled: false }], shippingMethods: [{ id: 'standard', label: 'Giao tiêu chuẩn 1-3 ngày', enabled: true, fee: 10000 }, { id: 'express', label: 'Giao nhanh 2-3 giờ', enabled: true, fee: 30000 }] }
const validMethods = (methods: unknown, fallback: Method[], withFee = false) => Array.isArray(methods) && methods.every(item => item && typeof item.id === 'string' && typeof item.label === 'string') ? methods.map((item: any) => ({ id: item.id, label: item.label, enabled: item.enabled !== false, ...(withFee ? { fee: Number(item.fee) || 0 } : {}) })) : fallback
const parse = (value: string | null): SystemSettings => { try { const saved = value ? JSON.parse(value) : {}; const accountEnabled = saved.accountEnabled ?? saved.bankTransferEnabled ?? defaults.accountEnabled; const walletEnabled = saved.walletEnabled ?? saved.vnpayEnabled ?? defaults.walletEnabled; return { ...defaults, ...saved, accountEnabled, walletEnabled, paymentMethods: validMethods(saved.paymentMethods, defaults.paymentMethods).map((method: Method) => method.id === 'cod' ? { ...method, enabled: saved.codEnabled ?? method.enabled } : method.id === 'bank' ? { ...method, enabled: accountEnabled } : method.id === 'wallet' ? { ...method, enabled: walletEnabled } : method), shippingMethods: validMethods(saved.shippingMethods, defaults.shippingMethods, true) } } catch { return defaults } }

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!isAdmin(auth)) return unauthorizedResponse()
  const { data, error } = await supabase.from('AdminSettings').select('value').eq('key', SETTINGS_KEY).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ settings: parse(data?.value ?? null) })
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!isAdmin(auth)) return unauthorizedResponse()
  const body = await request.json() as Partial<SystemSettings>
  const settings: SystemSettings = { storeName: typeof body.storeName === 'string' ? body.storeName.trim() : '', supportEmail: typeof body.supportEmail === 'string' ? body.supportEmail.trim() : '', supportPhone: typeof body.supportPhone === 'string' ? body.supportPhone.trim() : '', codEnabled: body.codEnabled === true, accountEnabled: body.accountEnabled === true, walletEnabled: body.walletEnabled === true, standardShippingFee: Number(body.standardShippingFee), expressShippingFee: Number(body.expressShippingFee), paymentMethods: validMethods(body.paymentMethods, defaults.paymentMethods), shippingMethods: validMethods(body.shippingMethods, defaults.shippingMethods, true) }
  if (!settings.storeName || !/^\S+@\S+\.\S+$/.test(settings.supportEmail) || !settings.supportPhone || !Number.isFinite(settings.standardShippingFee) || settings.standardShippingFee < 0 || !Number.isFinite(settings.expressShippingFee) || settings.expressShippingFee < 0) return NextResponse.json({ error: 'Thông tin cài đặt không hợp lệ.' }, { status: 400 })
  const { error } = await supabase.from('AdminSettings').upsert({ key: SETTINGS_KEY, value: JSON.stringify(settings), updatedAt: new Date().toISOString() }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ settings })
}
