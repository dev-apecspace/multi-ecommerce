import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentProof } from '@/lib/payment-proof-verification'

/** Checks a receipt before an order is created. This is deliberately advisory:
 * a recognised transaction may continue, while a non-transaction image may not. */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const orderNumber = String(formData.get('orderNumber') || '')
    const amount = Number(formData.get('amount'))
    const orderCreatedAt = String(formData.get('orderCreatedAt') || '')
    if (!(file instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ error: 'Vui lòng chọn ảnh JPG, PNG hoặc WEBP.' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Ảnh giao dịch tối đa 5MB.' }, { status: 400 })
    if (!orderNumber || !Number.isFinite(amount) || amount < 0 || Number.isNaN(new Date(orderCreatedAt).getTime())) {
      return NextResponse.json({ error: 'Thiếu thông tin đơn hàng để kiểm tra ảnh.' }, { status: 400 })
    }
    const verification = await verifyPaymentProof({ buffer: Buffer.from(await file.arrayBuffer()), mimeType: file.type, amount, orderNumber, orderCreatedAt, submittedAt: new Date() })
    if (verification.status === 'rejected') {
      return NextResponse.json({ error: 'Không nhận diện được đây là ảnh giao dịch. Vui lòng gửi ảnh xác nhận chuyển tiền rõ nét.', verification }, { status: 422 })
    }
    if (verification.status === 'error' || verification.status === 'unavailable') {
      return NextResponse.json({ error: 'Chưa thể kiểm tra ảnh tự động. Vui lòng thử lại ảnh giao dịch rõ nét.', verification }, { status: 503 })
    }
    return NextResponse.json({ data: { verification } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể kiểm tra ảnh minh chứng.' }, { status: 500 })
  }
}
