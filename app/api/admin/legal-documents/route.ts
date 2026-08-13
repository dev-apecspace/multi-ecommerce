import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!isAdmin(auth)) return unauthorizedResponse()
  const { data, error } = await supabase.from('LegalDocument').select('*').order('updatedAt', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data: data || [] })
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!isAdmin(auth)) return unauthorizedResponse()
  const body = await request.json()
  if (!body.code || !body.title || !body.fileName || !body.fileUrl) {
    return NextResponse.json({ error: 'Thiếu thông tin tài liệu.' }, { status: 400 })
  }
  const { data, error } = await supabase.from('LegalDocument').upsert({
    code: body.code, title: body.title, fileName: body.fileName, fileUrl: body.fileUrl,
    updatedAt: new Date().toISOString(), updatedBy: auth?.userId,
  }, { onConflict: 'code' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
