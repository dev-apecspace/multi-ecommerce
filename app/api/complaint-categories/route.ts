import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return unauthorizedResponse()
  const admin = isAdmin(auth)
  let query = db.from('ComplaintCategory').select('*').order('sortOrder').order('name')
  if (!admin) query = query.eq('active', true)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Không thể tải danh mục hỗ trợ.' }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(request: NextRequest) {
  if (!isAdmin(await getAuthFromRequest(request))) return unauthorizedResponse()
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const groupName = body.groupName === 'service' ? 'service' : 'general'
    if (!name || name.length > 100) return NextResponse.json({ error: 'Tên loại vấn đề bắt buộc, tối đa 100 ký tự.' }, { status: 400 })
    const slugBase = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category'
    const slug = `${slugBase}-${crypto.randomUUID().slice(0, 6)}`
    const { data, error } = await db.from('ComplaintCategory').insert({ name, slug, groupName, sortOrder: Number(body.sortOrder) || 500, active: body.active !== false }).select('*').single()
    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message.includes('duplicate') ? 'Tên danh mục đã tồn tại.' : 'Không thể thêm danh mục.' }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(await getAuthFromRequest(request))) return unauthorizedResponse()
  try {
    const body = await request.json()
    const id = Number(body.id)
    const name = String(body.name || '').trim()
    if (!Number.isInteger(id) || !name || name.length > 100) return NextResponse.json({ error: 'Thông tin danh mục không hợp lệ.' }, { status: 400 })
    const { data, error } = await db.from('ComplaintCategory').update({ name, groupName: body.groupName === 'service' ? 'service' : 'general', active: body.active === true, sortOrder: Number(body.sortOrder) || 500, updatedAt: new Date().toISOString() }).eq('id', id).select('*').single()
    if (error) throw error
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Không thể cập nhật danh mục.' }, { status: 400 })
  }
}
