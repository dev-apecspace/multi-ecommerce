import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request); if (!isAdmin(auth)) return unauthorizedResponse()
    const { searchParams } = new URL(request.url), page = Math.max(1, Number(searchParams.get('page') || 1)), limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20))), policyCode = searchParams.get('policyCode')
    let query = supabase.from('PolicyAcceptance').select('id, policyCode, policyTitle, documentName, documentUrl, documentVersion, acceptedAt, createdAt, User:userId(id, name, email)', { count: 'exact' }).order('acceptedAt', { ascending: false }).range((page - 1) * limit, page * limit - 1)
    if (policyCode) query = query.eq('policyCode', policyCode)
    const { data, error, count } = await query; if (error) throw error
    return NextResponse.json({ data: data || [], pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) } })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tải lịch sử xác nhận.' }, { status: 500 }) }
}
