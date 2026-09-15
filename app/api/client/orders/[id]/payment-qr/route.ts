import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { data: order, error } = await supabase.from('Order').select('id, orderNumber, userId, total, paymentMethod, Vendor(bankAccount, bankBin, walletQrUrl)').eq('id', Number(id)).single()
  if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (String(order.userId) !== String(auth.userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const vendor = Array.isArray(order.Vendor) ? order.Vendor[0] : order.Vendor
  const qrUrl = order.paymentMethod === 'wallet' ? vendor?.walletQrUrl : vendor?.bankBin && vendor?.bankAccount ? `https://img.vietqr.io/image/${vendor.bankBin}-${vendor.bankAccount}-compact2.png?amount=${Math.round(Number(order.total))}&addInfo=${encodeURIComponent(order.orderNumber)}` : null
  if (!qrUrl) return NextResponse.json({ error: 'QR is unavailable' }, { status: 400 })
  const qrResponse = await fetch(qrUrl)
  if (!qrResponse.ok || !qrResponse.body) return NextResponse.json({ error: 'Unable to download QR' }, { status: 502 })
  return new NextResponse(qrResponse.body, { headers: { 'Content-Type': qrResponse.headers.get('content-type') || 'image/png', 'Content-Disposition': `attachment; filename="qr-${order.orderNumber}.png"`, 'Cache-Control': 'no-store' } })
}
