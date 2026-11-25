import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest) {
  if (!isAdmin(await getAuthFromRequest(request))) return unauthorizedResponse()
  const { searchParams } = new URL(request.url)
  if (searchParams.get('history') === '1') {
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)))
    const { data, error, count } = await supabase.from('VendorWarningAcceptance').select('*', { count: 'exact' }).order('acceptedAt', { ascending: false }).range((page - 1) * limit, page * limit - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ acceptances: data || [], total: count || 0 })
  }
  const { data, error } = await supabase.from('VendorRegistrationWarning').select('id, title, content, version, minReadSeconds, updatedAt').eq('id', 1).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ warning: data })
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!isAdmin(auth)) return unauthorizedResponse()
  try {
    const body = await request.json()
    const title = String(body.title || '').trim()
    const content = String(body.content || '').trim()
    const minReadSeconds = Number(body.minReadSeconds)
    if (!title || !content || !Number.isInteger(minReadSeconds) || minReadSeconds < 0 || minReadSeconds > 600) {
      return NextResponse.json({ error: 'Vui lòng nhập tiêu đề, nội dung và thời gian đọc từ 0 đến 600 giây.' }, { status: 400 })
    }
    const { data: current } = await supabase.from('VendorRegistrationWarning')
      .select('title, content, version, minReadSeconds')
      .eq('id', 1)
      .maybeSingle()
    const hasChanged = !current || current.title !== title || current.content !== content || current.minReadSeconds !== minReadSeconds
    const { data, error } = await supabase.from('VendorRegistrationWarning').upsert({
      id: 1, title, content, minReadSeconds, version: hasChanged ? (current?.version || 0) + 1 : current.version,
      updatedBy: auth?.userId || null, updatedAt: new Date().toISOString(),
    }).select('id, title, content, version, minReadSeconds, updatedAt').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ warning: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể cập nhật cảnh báo.' }, { status: 500 })
  }
}
