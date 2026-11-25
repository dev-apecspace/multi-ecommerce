import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/api-auth'
import { readFile } from 'fs/promises'
import path from 'path'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) return unauthorizedResponse()
    const userId = Number(auth.userId)
    if (!Number.isInteger(userId)) return unauthorizedResponse()
    const { data: user, error: userError } = await db.from('User').select('id,name,email,phone').eq('id', userId).maybeSingle()
    if (userError || !user) return unauthorizedResponse()
    const body = await request.json()
    const submitterName = String(user.name || '').trim()
    const email = String(user.email || '').trim().toLowerCase()
    const description = String(body.description || '').trim()
    const categoryId = Number(body.categoryId)
    const phone = String(user.phone || '').trim()
    const evidenceUrls = Array.isArray(body.evidenceUrls) ? body.evidenceUrls.filter((url: unknown) => typeof url === 'string').slice(0, 5) : []
    const evidenceNames = Array.isArray(body.evidenceNames) ? body.evidenceNames.filter((name: unknown) => typeof name === 'string').map((name: string) => name.slice(0, 120)).slice(0, 5) : []
    if (evidenceUrls.some((id: string) => !/^[0-9a-f-]{36}$/i.test(id))) return NextResponse.json({ error: 'Tệp bằng chứng không hợp lệ.' }, { status: 400 })
    const evidenceDir = path.join(process.cwd(), '.private', 'complaint-evidence')
    for (const id of evidenceUrls) {
      try {
        const owner = await readFile(path.join(evidenceDir, `${id}.owner`), 'utf8')
        if (owner !== String(userId)) return NextResponse.json({ error: 'Một trong các tệp bằng chứng không thuộc phiên gửi này.' }, { status: 403 })
      } catch { return NextResponse.json({ error: 'Không tìm thấy tệp bằng chứng đã tải lên.' }, { status: 400 }) }
    }
    if (!Number.isInteger(categoryId) || !submitterName || submitterName.length > 150 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || description.length < 10 || description.length > 10000) {
      return NextResponse.json({ error: 'Vui lòng chọn loại vấn đề và mô tả nội dung tối thiểu 10 ký tự.' }, { status: 400 })
    }
    const { data: category } = await db.from('ComplaintCategory').select('id,name').eq('id', categoryId).eq('active', true).maybeSingle()
    if (!category) return NextResponse.json({ error: 'Vui lòng chọn một loại vấn đề đang được hỗ trợ.' }, { status: 400 })
    const subject = description.replace(/\s+/g, ' ').slice(0, 100)
    const caseCode = `AP-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`
    const { data, error } = await db.from('ComplaintCase').insert({ submitterUserId: userId, categoryId, categoryName: category.name, caseCode, submitterName, email, phone, subject, description, evidenceUrls, evidenceNames, status: 'received' }).select('id,caseCode,status,createdAt').single()
    if (error) throw error
    const { error: eventError } = await db.from('ComplaintCaseEvent').insert({ caseId: data.id, status: 'received', message: 'Đã gửi phản ánh. Yêu cầu đang chờ admin tiếp nhận.' })
    if (eventError) throw eventError
    const { error: messageError } = await db.from('ComplaintMessage').insert({ caseId: data.id, senderUserId: userId, senderRole: 'customer', senderName: submitterName, message: `Loại vấn đề: ${category.name}\n\n${description}`, evidenceUrls, evidenceNames })
    if (messageError) throw messageError
    return NextResponse.json({ data: { caseCode, status: data.status, createdAt: data.createdAt } }, { status: 201 })
  } catch (error) {
    console.error('Complaint intake failed:', error)
    return NextResponse.json({ error: 'Không thể gửi phản ánh lúc này. Vui lòng thử lại sau.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return unauthorizedResponse()
  const userId = Number(auth.userId)
  const { data: cases, error } = await db.from('ComplaintCase').select('id,caseCode,categoryId,categoryName,subject,description,status,resolution,evidenceUrls,evidenceNames,customerReplyDeadline,customerRating,customerFeedback,ratedAt,createdAt,updatedAt').eq('submitterUserId', userId).order('createdAt', { ascending: false })
  if (error) {
    console.error('Complaint list query failed:', error)
    if (error.code === '42703' || error.code === 'PGRST204') {
      return NextResponse.json({ error: 'Database chưa có các cột mới của hệ thống phản ánh. Hãy chạy supabase/migrations/create_complaint_case_system.sql trên Supabase rồi thử lại.', code: 'COMPLAINT_SCHEMA_OUTDATED' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Không thể tải danh sách phản ánh.' }, { status: 500 })
  }
  const ids = (cases || []).map(item => item.id)
  const { data: events, error: eventsError } = ids.length
    ? await db.from('ComplaintCaseEvent').select('caseId,status,message,createdAt').in('caseId', ids).order('createdAt')
    : { data: [], error: null }
  if (eventsError) {
    console.error('Complaint timeline query failed:', eventsError)
    if (eventsError.code === '42703' || eventsError.code === 'PGRST204' || eventsError.code === 'PGRST205') {
      return NextResponse.json({ error: 'Database chưa có đầy đủ bảng/cột timeline của hệ thống phản ánh. Hãy chạy supabase/migrations/create_complaint_case_system.sql trên Supabase rồi thử lại.', code: 'COMPLAINT_SCHEMA_OUTDATED' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Không thể tải timeline hồ sơ.' }, { status: 500 })
  }
  return NextResponse.json({ data: (cases || []).map(item => ({ ...item, events: (events || []).filter(event => event.caseId === item.id) })) })
}
