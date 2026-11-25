import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const adminActions = new Set(['accepted', 'resolved', 'rejected'])
const terminalStates = new Set(['resolved', 'rejected', 'cancelled'])

export async function GET(request: NextRequest) {
  if (!isAdmin(await getAuthFromRequest(request))) return unauthorizedResponse()
  const { data: cases, error } = await db.from('ComplaintCase').select('*').order('updatedAt', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = (cases || []).map(item => item.id)
  const { data: events, error: eventError } = ids.length
    ? await db.from('ComplaintCaseEvent').select('*').in('caseId', ids).order('createdAt')
    : { data: [], error: null }
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 })
  return NextResponse.json({ data: (cases || []).map(item => ({ ...item, events: (events || []).filter(event => event.caseId === item.id) })) })
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!isAdmin(auth)) return unauthorizedResponse()
  try {
    const body = await request.json()
    const id = Number(body.id)
    const status = String(body.status || '')
    const message = String(body.message || '').trim()
    const resolution = String(body.resolution || '').trim()
    if (!Number.isInteger(id) || !adminActions.has(status) || !message) return NextResponse.json({ error: 'Admin chỉ có thể tiếp nhận, từ chối hoặc giải quyết phản ánh.' }, { status: 400 })
    const { data: previous, error: lookupError } = await db.from('ComplaintCase').select('id,status').eq('id', id).maybeSingle()
    if (lookupError || !previous) return NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404 })
    if (terminalStates.has(previous.status)) return NextResponse.json({ error: 'Hồ sơ đã kết thúc và không thể cập nhật.' }, { status: 409 })
    if (status === 'accepted' && previous.status !== 'received') return NextResponse.json({ error: 'Chỉ có thể tiếp nhận phản ánh đang chờ tiếp nhận.' }, { status: 409 })
    const now = new Date()
    const updateData = {
      status,
      resolution: resolution || null,
      updatedAt: now.toISOString(),
      customerReplyDeadline: null,
    }
    const { data, error } = await db.from('ComplaintCase').update(updateData).eq('id', id).eq('status', previous.status).select('*').maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Trạng thái vừa được cập nhật ở nơi khác. Hãy tải lại hồ sơ.' }, { status: 409 })
    const { error: eventError } = await db.from('ComplaintCaseEvent').insert({ caseId: id, status, message, createdBy: Number(auth!.userId) || null })
    if (eventError) throw eventError
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Complaint update failed:', error)
    return NextResponse.json({ error: 'Không thể cập nhật hồ sơ.' }, { status: 500 })
  }
}
