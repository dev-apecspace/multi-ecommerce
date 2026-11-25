import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcryptjs from 'bcryptjs'
import { getAuthFromRequest, hasPermission, isVendor, unauthorizedResponse } from '@/lib/api-auth'
import { ACCOUNT_PERMISSION_OPTIONS } from '@/lib/account-permissions'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function authorize(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth || !isVendor(auth) || !auth.vendorId) return { auth: null, response: unauthorizedResponse() }
  const [{ data: owner }, { data: grant }] = await Promise.all([
    supabase.from('Vendor').select('id, status').eq('id', auth.vendorId).eq('userId', auth.userId).maybeSingle(),
    supabase.from('AccountAccess').select('scope, vendorId').eq('userId', auth.userId).eq('scope', 'seller').maybeSingle(),
  ])
  const { data: shop } = await supabase.from('Vendor').select('status').eq('id', auth.vendorId).maybeSingle()
  if (shop?.status !== 'approved') return { auth: null, response: NextResponse.json({ error: 'Chỉ shop đã được duyệt mới quản lý được tài khoản nhân viên.' }, { status: 403 }) }
  if (!owner && (!grant || Number(grant.vendorId) !== Number(auth.vendorId) || !hasPermission(auth, 'accounts'))) {
    return { auth: null, response: NextResponse.json({ error: 'Chỉ chủ shop hoặc tài khoản được cấp quyền mới quản lý được nhân viên.' }, { status: 403 }) }
  }
  return { auth, response: null }
}

export async function GET(request: NextRequest) {
  const { auth, response } = await authorize(request)
  if (response || !auth) return response
  const { data: grants, error } = await supabase.from('AccountAccess').select('userId, permissions, createdAt').eq('scope', 'seller').eq('vendorId', auth.vendorId!).order('createdAt', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const ids = (grants || []).map((grant) => grant.userId)
  const { data: users, error: usersError } = ids.length
    ? await supabase.from('User').select('id, name, email, phone, status, joinDate').in('id', ids)
    : { data: [], error: null }
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 400 })
  const byId = new Map((users || []).map((user) => [user.id, user]))
  return NextResponse.json({ data: (grants || []).map((grant) => ({ ...byId.get(grant.userId), permissions: grant.permissions || [] })).filter((account) => account.id) })
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authorize(request)
  if (response || !auth) return response
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = String(body.phone || '').trim()
    const permissions = Array.isArray(body.permissions) ? [...new Set(body.permissions.map(String))] : []
    const valid = new Set(ACCOUNT_PERMISSION_OPTIONS.seller.map((permission) => permission.key))
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Vui lòng nhập tên và email hợp lệ.' }, { status: 400 })
    if (permissions.some((permission) => !valid.has(permission))) return NextResponse.json({ error: 'Danh sách quyền không hợp lệ.' }, { status: 400 })
    if (auth.permissions && permissions.some((permission) => !auth.permissions!.includes(permission))) return NextResponse.json({ error: 'Bạn chỉ được cấp các quyền mình đang có.' }, { status: 403 })
    const { data: existing } = await supabase.from('User').select('id').eq('email', email).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Email này đã có tài khoản.' }, { status: 409 })

    const initialPassword = randomBytes(9).toString('base64url')
    const { data: user, error: userError } = await supabase.from('User').insert({
      name, email, phone: phone || null, password: await bcryptjs.hash(initialPassword, 10), role: 'vendor', status: 'active',
    }).select('id, name, email, phone, status, joinDate').single()
    if (userError || !user) return NextResponse.json({ error: userError?.message || 'Không thể tạo tài khoản.' }, { status: 400 })
    const { error: grantError } = await supabase.from('AccountAccess').insert({ userId: user.id, scope: 'seller', vendorId: auth.vendorId, permissions, createdBy: auth.userId })
    if (grantError) {
      await supabase.from('User').delete().eq('id', user.id)
      return NextResponse.json({ error: grantError.message }, { status: 400 })
    }
    return NextResponse.json({ data: { ...user, permissions }, initialPassword }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tạo tài khoản.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { auth, response } = await authorize(request)
  if (response || !auth) return response
  try {
    const body = await request.json()
    const userId = Number(body.userId)
    if (!Number.isSafeInteger(userId) || userId === Number(auth.userId)) return NextResponse.json({ error: 'Không thể chỉnh sửa tài khoản hiện tại.' }, { status: 400 })
    const { data: grant } = await supabase.from('AccountAccess').select('userId').eq('userId', userId).eq('scope', 'seller').eq('vendorId', auth.vendorId!).maybeSingle()
    if (!grant) return NextResponse.json({ error: 'Không tìm thấy tài khoản nhân viên của shop.' }, { status: 404 })
    if (Array.isArray(body.permissions)) {
      const permissions = [...new Set(body.permissions.map(String))]
      const valid = new Set(ACCOUNT_PERMISSION_OPTIONS.seller.map((permission) => permission.key))
      if (permissions.some((permission) => !valid.has(permission)) || (auth.permissions && permissions.some((permission) => !auth.permissions!.includes(permission)))) return NextResponse.json({ error: 'Danh sách quyền không hợp lệ hoặc vượt quyền của bạn.' }, { status: 403 })
      const { error } = await supabase.from('AccountAccess').update({ permissions, updatedAt: new Date().toISOString() }).eq('userId', userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể cập nhật tài khoản.' }, { status: 500 })
  }
}
