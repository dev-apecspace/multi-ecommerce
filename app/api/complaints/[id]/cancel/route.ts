import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/api-auth'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const cancellableStatuses = ['received', 'accepted', 'processing']

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return unauthorizedResponse()
  const { id: rawId } = await params
  const id = Number(rawId)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Hồ sơ không hợp lệ.' }, { status: 400 })

  const { data: complaint, error } = await db.from('ComplaintCase').select('id,status,submitterUserId').eq('id', id).maybeSingle()
  if (error || !complaint) return NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404 })
  if (Number(complaint.submitterUserId) !== Number(auth.userId)) return unauthorizedResponse()
  if (!cancellableStatuses.includes(complaint.status)) return NextResponse.json({ error: 'Chỉ có thể hủy phản ánh đang chờ tiếp nhận hoặc đang xử lý.' }, { status: 409 })

  const now = new Date().toISOString()
  const { data, error: updateError } = await db.from('ComplaintCase').update({ status: 'cancelled', updatedAt: now, customerReplyDeadline: null }).eq('id', id).in('status', cancellableStatuses).select('id,status,updatedAt').maybeSingle()
  if (updateError) return NextResponse.json({ error: 'Không thể hủy phản ánh.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Trạng thái phản ánh vừa thay đổi. Hãy tải lại hồ sơ.' }, { status: 409 })
  const { error: eventError } = await db.from('ComplaintCaseEvent').insert({ caseId: id, status: 'cancelled', message: 'Khách hàng đã hủy phản ánh.', createdBy: Number(auth.userId) || null })
  if (eventError) return NextResponse.json({ error: 'Phản ánh đã hủy nhưng không thể lưu timeline.' }, { status: 500 })
  return NextResponse.json({ data })
}
