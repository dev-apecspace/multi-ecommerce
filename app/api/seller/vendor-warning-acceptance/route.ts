import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function getCurrentWarning() {
  return supabase.from('VendorRegistrationWarning').select('title, content, version, minReadSeconds').eq('id', 1).single()
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth || !isVendor(auth)) return unauthorizedResponse()
  const { data: warning, error: warningError } = await getCurrentWarning()
  if (warningError) return NextResponse.json({ error: warningError.message }, { status: 400 })
  const { data: acceptances, error } = await supabase.from('VendorWarningAcceptance')
    .select('id, warningVersion, warningTitle, warningContent, acceptedAt')
    .eq('vendorId', auth.vendorId!)
    .order('acceptedAt', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  // Admin saves can advance the version without changing the actual warning.
  // Treat that as already accepted, while real text changes still require consent.
  const currentAcceptance = acceptances?.find((acceptance) =>
    acceptance.warningVersion === warning.version ||
    (acceptance.warningTitle === warning.title && acceptance.warningContent === warning.content)
  ) || null
  return NextResponse.json({ warning, acceptance: currentAcceptance || null })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth || !isVendor(auth)) return unauthorizedResponse()
  try {
    const body = await request.json()
    const { data: warning, error: warningError } = await getCurrentWarning()
    if (warningError || !warning) return NextResponse.json({ error: 'Không tải được nội dung cảnh báo hiện hành.' }, { status: 400 })
    if (body.accepted !== true || Number(body.version) !== warning.version) {
      return NextResponse.json({ error: 'Cảnh báo đã thay đổi hoặc chưa được xác nhận. Vui lòng đọc lại.' }, { status: 409 })
    }

    const { data: existingRecords, error: existingError } = await supabase.from('VendorWarningAcceptance')
      .select('id, warningVersion, warningTitle, warningContent, acceptedAt')
      .eq('vendorId', auth.vendorId!)
      .order('acceptedAt', { ascending: false })
      .limit(100)
    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 })
    const existing = existingRecords?.find((acceptance) =>
      acceptance.warningVersion === warning.version ||
      (acceptance.warningTitle === warning.title && acceptance.warningContent === warning.content)
    )
    if (existing) return NextResponse.json({ accepted: true, acceptance: existing })

    const [{ data: user, error: userError }, { data: vendor, error: vendorError }] = await Promise.all([
      supabase.from('User').select('name,email').eq('id', auth.userId).single(),
      supabase.from('Vendor').select('name').eq('id', auth.vendorId!).single(),
    ])
    if (userError || vendorError || !user || !vendor) return NextResponse.json({ error: 'Không tìm thấy tài khoản hoặc cửa hàng.' }, { status: 404 })

    const { data: acceptance, error } = await supabase.from('VendorWarningAcceptance').insert({
      userId: auth.userId,
      vendorId: auth.vendorId,
      userName: user.name,
      email: user.email,
      shopName: vendor.name,
      warningVersion: warning.version,
      warningTitle: warning.title,
      warningContent: warning.content,
    }).select('id, warningVersion, acceptedAt').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ accepted: true, acceptance }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể lưu xác nhận.' }, { status: 500 })
  }
}
