import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'
import { readFile } from 'fs/promises'
import path from 'path'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function getCase(id: number) {
  return db.from('ComplaintCase').select('id,submitterUserId,status').eq('id', id).maybeSingle()
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return unauthorizedResponse()
  const { id: rawId } = await params
  const id = Number(rawId)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Hồ sơ không hợp lệ.' }, { status: 400 })
  const { data: complaint, error } = await getCase(id)
  if (error || !complaint) return NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404 })
  if (!isAdmin(auth) && Number(complaint.submitterUserId) !== Number(auth.userId)) return unauthorizedResponse()
  const { data, error: messagesError } = await db.from('ComplaintMessage').select('id,caseId,senderRole,senderName,message,evidenceUrls,evidenceNames,createdAt').eq('caseId', id).order('createdAt')
  if (messagesError) {
    console.error('Complaint messages query failed:', messagesError)
    if (messagesError.code === '42703' || messagesError.code === 'PGRST204' || messagesError.code === 'PGRST205') {
      return NextResponse.json({ error: 'Database chưa có đầy đủ cột/bảng hội thoại phản ánh. Hãy chạy supabase/migrations/create_complaint_case_system.sql trên Supabase rồi thử lại.', code: 'COMPLAINT_SCHEMA_OUTDATED' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Không thể tải hội thoại.' }, { status: 500 })
  }
  return NextResponse.json({ data: data || [] })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return unauthorizedResponse()
  const { id: rawId } = await params
  const id = Number(rawId)
  const body = await request.json()
  const message = String(body.message || '').trim()
  const evidenceUrls = Array.isArray(body.evidenceUrls) ? body.evidenceUrls.filter((item: unknown) => typeof item === 'string').slice(0, 5) : []
  const evidenceNames = Array.isArray(body.evidenceNames) ? body.evidenceNames.filter((item: unknown) => typeof item === 'string').map((item: string) => item.slice(0, 120)).slice(0, 5) : []
  if (!Number.isInteger(id) || !message || message.length > 4000) return NextResponse.json({ error: 'Tin nhắn bắt buộc và tối đa 4.000 ký tự.' }, { status: 400 })
  if (evidenceUrls.some((fileId: string) => !/^[0-9a-f-]{36}$/i.test(fileId))) return NextResponse.json({ error: 'Tệp đính kèm không hợp lệ.' }, { status: 400 })
  const evidenceDir = path.join(process.cwd(), '.private', 'complaint-evidence')
  for (const fileId of evidenceUrls) {
    try {
      const owner = await readFile(path.join(evidenceDir, `${fileId}.owner`), 'utf8')
      if (owner !== String(auth.userId)) return NextResponse.json({ error: 'Tệp đính kèm không thuộc tài khoản của bạn.' }, { status: 403 })
    } catch { return NextResponse.json({ error: 'Không tìm thấy tệp đính kèm.' }, { status: 400 }) }
  }
  const { data: complaint, error } = await getCase(id)
  if (error || !complaint) return NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404 })
  const admin = isAdmin(auth)
  if (!admin && Number(complaint.submitterUserId) !== Number(auth.userId)) return unauthorizedResponse()
  if (['resolved','rejected','cancelled','closed'].includes(complaint.status)) return NextResponse.json({ error: 'Hồ sơ đã kết thúc và hội thoại đã khóa.' }, { status: 409 })
  const senderRole = admin ? 'admin' : 'customer'
  const { data: user } = await db.from('User').select('id,name').eq('id', Number(auth.userId)).maybeSingle()
  const senderName = admin ? `Hỗ trợ APECSPACE${user?.name ? ` · ${user.name}` : ''}` : user?.name || 'Khách hàng'
  const { data, error: insertError } = await db.from('ComplaintMessage').insert({ caseId: id, senderUserId: Number(auth.userId), senderRole, senderName, message, evidenceUrls, evidenceNames }).select('id,caseId,senderRole,senderName,message,evidenceUrls,evidenceNames,createdAt').single()
  if (insertError) return NextResponse.json({ error: 'Không thể gửi tin nhắn.' }, { status: 500 })
  const nextStatus = admin
    ? complaint.status === 'received' ? 'accepted' : complaint.status === 'accepted' ? 'processing' : complaint.status
    : complaint.status === 'accepted' ? 'processing' : complaint.status
  const now = new Date()
  const deadline = admin ? new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() : null
  const { data: updatedCase, error: updateError } = await db.from('ComplaintCase').update({ status: nextStatus, updatedAt: now.toISOString(), customerReplyDeadline: deadline }).eq('id', id).eq('status', complaint.status).select('id').maybeSingle()
  if (updateError || !updatedCase) {
    await db.from('ComplaintMessage').delete().eq('id', data.id)
    if (updateError) return NextResponse.json({ error: 'Tin nhắn đã nhận nhưng không thể cập nhật trạng thái.' }, { status: 500 })
    return NextResponse.json({ error: 'Trạng thái hồ sơ vừa thay đổi. Hãy tải lại rồi gửi lại tin nhắn.' }, { status: 409 })
  }
  const timelineMessage = admin
    ? complaint.status === 'received' ? 'Admin đã tiếp nhận phản ánh và phản hồi.' : `Admin đã phản hồi${nextStatus === 'processing' ? ', phản ánh đang được xử lý.' : '.'}`
    : 'Khách hàng đã phản hồi trong hội thoại.'
  const { error: timelineError } = await db.from('ComplaintCaseEvent').insert({ caseId: id, status: nextStatus, message: timelineMessage, createdBy: Number(auth.userId) || null })
  if (timelineError) return NextResponse.json({ error: 'Tin nhắn đã gửi nhưng không thể lưu timeline.' }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
