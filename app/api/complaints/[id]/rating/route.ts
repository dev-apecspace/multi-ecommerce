import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/api-auth'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return unauthorizedResponse()
  const { id: rawId } = await params
  const id = Number(rawId)
  const body = await request.json()
  const rating = Number(body.rating)
  const feedback = String(body.feedback || '').trim().slice(0, 2000)
  if (!Number.isInteger(id) || !Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: 'Vui lòng chọn mức đánh giá từ 1 đến 5 sao.' }, { status: 400 })
  const { data: complaint, error: findError } = await db.from('ComplaintCase').select('id,status,submitterUserId,customerRating').eq('id', id).maybeSingle()
  if (findError || !complaint) return NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404 })
  if (Number(complaint.submitterUserId) !== Number(auth.userId)) return unauthorizedResponse()
  if (complaint.status !== 'resolved') return NextResponse.json({ error: 'Chỉ có thể đánh giá hồ sơ đã giải quyết.' }, { status: 400 })
  if (complaint.customerRating) return NextResponse.json({ error: 'Bạn đã gửi đánh giá cho hồ sơ này.' }, { status: 409 })
  const ratedAt = new Date().toISOString()
  const { data, error } = await db.from('ComplaintCase').update({ customerRating: rating, customerFeedback: feedback || null, ratedAt }).eq('id', id).eq('status', 'resolved').is('customerRating', null).select('id,customerRating,customerFeedback,ratedAt').maybeSingle()
  if (error) return NextResponse.json({ error: 'Không lưu được đánh giá.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Hồ sơ vừa được đánh giá hoặc đã đổi trạng thái.' }, { status: 409 })
  await db.from('ComplaintCaseEvent').insert({ caseId: id, status: 'resolved', message: `Khách hàng đã đánh giá quá trình hỗ trợ ${rating}/5 sao.` })
  return NextResponse.json({ data })
}
