import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const POLICIES = {
  'intermediary-payment-agreement': { title: 'Hợp đồng trung gian thanh toán', documentCode: 'intermediary-payment-agreement' },
  'website-operating-conditions': { title: 'Điều kiện hoạt động', documentCode: 'operating-regulations' },
  'terms-of-service': { title: 'Điều khoản sử dụng', documentCode: 'terms-of-service' },
  'privacy-policy': { title: 'Chính sách bảo mật', documentCode: 'privacy-policy' },
} as const

async function getCurrentAcceptance(userId: number, policyCode: keyof typeof POLICIES) {
  const policy = POLICIES[policyCode]
  const { data: document, error: documentError } = await supabase
    .from('LegalDocument')
    .select('fileUrl')
    .eq('code', policy.documentCode)
    .maybeSingle()
  if (documentError) throw documentError

  let query = supabase
    .from('PolicyAcceptance')
    .select('id, acceptedAt')
    .eq('userId', userId)
    .eq('policyCode', policyCode)
    .limit(1)

  // The uploaded file URL changes on every replacement, making it the policy-version identity.
  query = document?.fileUrl
    ? query.eq('documentUrl', document.fileUrl)
    : query.is('documentUrl', null)

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) return unauthorizedResponse()
    const policyCode = new URL(request.url).searchParams.get('policyCode')
    if (!policyCode || !Object.prototype.hasOwnProperty.call(POLICIES, policyCode)) {
      return NextResponse.json({ error: 'Chính sách không hợp lệ.' }, { status: 400 })
    }
    const acceptance = await getCurrentAcceptance(Number(auth.userId), policyCode as keyof typeof POLICIES)
    return NextResponse.json({ accepted: Boolean(acceptance), data: acceptance || null })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể kiểm tra lịch sử chấp nhận.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) return unauthorizedResponse()
    const { policyCode } = await request.json()
    if (!Object.prototype.hasOwnProperty.call(POLICIES, policyCode)) return NextResponse.json({ error: 'Chính sách không hợp lệ.' }, { status: 400 })
    const policy = POLICIES[policyCode as keyof typeof POLICIES]
    const { data: document } = await supabase.from('LegalDocument').select('title, fileName, fileUrl, updatedAt').eq('code', policy.documentCode).maybeSingle()
    const documentVersion = document?.updatedAt || null
    const existing = await getCurrentAcceptance(Number(auth.userId), policyCode as keyof typeof POLICIES)
    if (existing) return NextResponse.json({ data: existing, alreadyAccepted: true })

    const { data, error } = await supabase.from('PolicyAcceptance').insert({ userId: Number(auth.userId), policyCode, policyTitle: document?.title || policy.title, documentName: document?.fileName || null, documentUrl: document?.fileUrl || null, documentVersion, acceptedAt: new Date().toISOString() }).select().single()
    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    const message = error?.message || 'Không thể lưu xác nhận chính sách.'
    const isPolicyConstraintError = error?.code === '23514' || /policyCode.*check|check constraint/i.test(message)
    return NextResponse.json({
      error: isPolicyConstraintError
        ? 'Cơ sở dữ liệu chưa cập nhật loại chính sách mới. Vui lòng chạy migration add_privacy_policy_acceptance.sql.'
        : message,
    }, { status: 500 })
  }
}
