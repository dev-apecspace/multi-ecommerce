import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, hasPermission, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth || !isAdmin(auth)) return unauthorizedResponse()
  if (!hasPermission(auth, 'users')) return NextResponse.json({ error: 'Bạn chưa được cấp quyền quản lý người dùng.' }, { status: 403 })

  try {
    const { userId } = await request.json()
    const id = Number(userId)
    if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: 'Tài khoản không hợp lệ.' }, { status: 400 })

    const { data: settingsRow, error: settingsError } = await supabase.from('AdminSettings').select('value').eq('key', 'system').maybeSingle()
    if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 400 })
    let settings: Record<string, unknown> = {}
    try { settings = settingsRow?.value ? JSON.parse(settingsRow.value) : {} } catch { settings = {} }
    const defaultPasswordHash = settings.defaultCustomerPasswordHash
    if (typeof defaultPasswordHash !== 'string' || !defaultPasswordHash.startsWith('$2')) {
      return NextResponse.json({ error: 'Admin chưa cài mật khẩu mặc định. Hãy cài tại Cài đặt hệ thống trước.' }, { status: 409 })
    }

    const { data: customer, error: customerError } = await supabase.from('User').select('id, role').eq('id', id).maybeSingle()
    if (customerError) return NextResponse.json({ error: customerError.message }, { status: 400 })
    if (!customer || !['customer', 'vendor'].includes(customer.role)) return NextResponse.json({ error: 'Không tìm thấy tài khoản người dùng để reset mật khẩu.' }, { status: 404 })

    const { error: updateError } = await supabase.from('User').update({ password: defaultPasswordHash }).eq('id', id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
    return NextResponse.json({ success: true, message: 'Đã đặt lại mật khẩu theo mật khẩu mặc định trong cài đặt.' })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể reset mật khẩu.' }, { status: 500 })
  }
}
