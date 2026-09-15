import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const timestamp = () => {
  const now = new Date()
  const values = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {})
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}${String(now.getMilliseconds()).padStart(3, '0')}`
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.TINGEE_CLIENT_ID
  const secretToken = process.env.TINGEE_SECRET_TOKEN
  if (!clientId || !secretToken) {
    return NextResponse.json({ error: 'Tingee is not configured. Add TINGEE_CLIENT_ID and TINGEE_SECRET_TOKEN.' }, { status: 503 })
  }

  try {
    const { orderId, payerBankBin } = await request.json()
    const { data: order, error } = await supabase
      .from('Order')
      .select('id, orderNumber, total, userId, Vendor(bankAccount, bankBin)')
      .eq('id', Number(orderId))
      .single()

    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (String(order.userId) !== String(auth.userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!payerBankBin) return NextResponse.json({ error: 'Payer bank BIN is required' }, { status: 400 })
    const vendor = Array.isArray(order.Vendor) ? order.Vendor[0] : order.Vendor
    if (!vendor?.bankAccount || !vendor?.bankBin) return NextResponse.json({ error: 'Seller bank details are incomplete' }, { status: 400 })

    const body = JSON.stringify({
      type: 'payment-with-bank-account',
      qrCode: '',
      redirectUrl: process.env.TINGEE_REDIRECT_URL || `${request.nextUrl.origin}/client/orders/${order.id}`,
      bankBin: String(payerBankBin || ''),
      destinationBankBin: vendor.bankBin,
      accountNumber: vendor.bankAccount,
      amount: Math.round(Number(order.total)),
      content: order.orderNumber,
    })
    const requestTimestamp = timestamp()
    const signature = crypto.createHmac('sha512', secretToken).update(`${requestTimestamp}:${body}`, 'utf8').digest('hex')
    console.info('[Tingee deeplink request]', { orderId: order.id, requestTimestamp, payerBankBin, destinationBankBin: vendor.bankBin, amount: Math.round(Number(order.total)) })
    const response = await fetch('https://open-api.tingee.vn/v1/deep-link/generate', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json', 'x-client-id': clientId, 'x-request-timestamp': requestTimestamp, 'x-signature': signature },
      body,
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) return NextResponse.json({ error: result?.message || result?.error || 'Tingee deeplink request failed' }, { status: response.status })
    const deeplink = result?.data?.deepLink || result?.data?.deeplink || result?.data?.url || result?.deepLink || result?.url
    if (!deeplink) return NextResponse.json({ error: 'Tingee response did not contain a deeplink', result }, { status: 502 })
    return NextResponse.json({ deeplink })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
