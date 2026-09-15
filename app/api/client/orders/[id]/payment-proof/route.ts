import { NextResponse } from 'next/server'

// Payment receipts are intentionally collected during checkout before the order is created.
// This legacy customer endpoint remains closed to prevent a second post-order upload flow.
export async function POST() {
  return NextResponse.json({ error: 'Minh chứng thanh toán cần được gửi tại bước 3 của checkout.' }, { status: 410 })
}
