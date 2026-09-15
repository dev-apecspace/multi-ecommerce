import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { verifyPaymentProof } from '@/lib/payment-proof-verification'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const formData = await request.formData()
    const userId = Number(formData.get('userId'))
    const file = formData.get('file')
    const { orderNumber } = await params
    if (!Number.isInteger(userId) || userId <= 0) return NextResponse.json({ error: 'Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ gá»­i minh chá»©ng.' }, { status: 401 })
    if (!(file instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return NextResponse.json({ error: 'Chá»‰ nháº­n áº£nh JPG, PNG hoáº·c WEBP.' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'áº¢nh giao dá»‹ch tá»‘i Ä‘a 5MB.' }, { status: 400 })
    const { data: order, error } = await supabase.from('Order').select('id, orderNumber, userId, vendorId, total, paymentMethod, paymentStatus, date').eq('orderNumber', decodeURIComponent(orderNumber)).maybeSingle()
    if (error) throw error
    if (!order || order.userId !== userId) return NextResponse.json({ error: 'KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng.' }, { status: 404 })
    if (order.paymentMethod === 'cod') return NextResponse.json({ error: 'ÄÆ¡n COD khÃ´ng cáº§n gá»­i minh chá»©ng.' }, { status: 400 })
    if (order.paymentStatus === 'paid') return NextResponse.json({ error: 'ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº­n thanh toÃ¡n.' }, { status: 400 })
    const buffer = Buffer.from(await file.arrayBuffer())
    const verification = await verifyPaymentProof({ buffer, mimeType: file.type, amount: Number(order.total), orderNumber: order.orderNumber, orderCreatedAt: order.date, submittedAt: new Date() })
    if (verification.status === 'rejected') {
      return NextResponse.json({ error: verification.reason, data: { verification } }, { status: 422 })
    }
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const folder = path.join('uploads', 'giao-dich', String(order.vendorId), new Date().toISOString().slice(0, 10))
    const fileName = `${order.orderNumber}-${Date.now()}.${extension}`
    await mkdir(path.join(process.cwd(), 'public', folder), { recursive: true })
    await writeFile(path.join(process.cwd(), 'public', folder, fileName), buffer)
    const { error: updateError } = await supabase.from('Order').update({ paymentProofUrl: `/${folder.replace(/\\/g, '/')}/${fileName}`, paymentSubmittedAt: new Date().toISOString(), paymentStatus: 'submitted', paymentVerificationStatus: verification.status === 'rejected' ? 'review' : verification.status, paymentVerificationData: verification, paymentVerifiedAt: null }).eq('id', order.id)
    if (updateError) throw updateError
    return NextResponse.json({ data: { verification, paymentProofUrl: `/${folder.replace(/\\/g, '/')}/${fileName}` } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ gá»­i minh chá»©ng.' }, { status: 500 })
  }
}
