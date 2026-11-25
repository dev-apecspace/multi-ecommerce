import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { vendorUserId, approved, rejectionReason } = await request.json()

    let adminId = request.headers.get('x-user-id')
    
    if (!adminId) {
      const authToken = request.cookies.get('auth_token')?.value
      if (authToken) {
        try {
          const user = JSON.parse(authToken)
          adminId = user.id
        } catch {
          adminId = null
        }
      }
    }

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('User')
      .select('role')
      .eq('id', adminId)
      .single()

    if (adminError || adminUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can approve vendors' },
        { status: 403 }
      )
    }

    const { data: existingVendor, error: existingVendorError } = await supabase
      .from('Vendor')
      .select('id, status')
      .eq('userId', vendorUserId)
      .order('createdAt', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existingVendorError || !existingVendor) return NextResponse.json({ error: 'Không tìm thấy hồ sơ shop.' }, { status: 404 })
    if (existingVendor.status === 'rejected' && approved) {
      return NextResponse.json({ error: 'Shop đã bị từ chối. Không thể phê duyệt lại.' }, { status: 409 })
    }

    if (approved) {
      const vendor = existingVendor

      const [{ data: documents, error: documentsError }, { data: monthlyFeeConfig, error: feeError }] = await Promise.all([
        supabase.from('VendorDocument').select('id, status').eq('vendorId', vendor.id),
        supabase.from('VendorMonthlyFeeConfig').select('vendorId').eq('vendorId', vendor.id).maybeSingle(),
      ])
      if (documentsError || feeError) {
        return NextResponse.json({ error: documentsError?.message || feeError?.message || 'Không thể kiểm tra điều kiện duyệt shop.' }, { status: 400 })
      }
      const activeDocuments = (documents || []).filter((document) => document.status !== 'rejected')
      if (activeDocuments.length === 0 || activeDocuments.some((document) => document.status !== 'approved')) {
        return NextResponse.json({ error: 'Cần duyệt toàn bộ hồ sơ hợp lệ của shop trước khi duyệt nhà bán hàng.' }, { status: 409 })
      }
      if (!monthlyFeeConfig) {
        return NextResponse.json({ error: 'Cần cấu hình phí hợp tác hàng tháng trước khi duyệt shop.' }, { status: 409 })
      }

      const { error: userError } = await supabase
        .from('User')
        .update({ status: 'active' })
        .eq('id', vendorUserId)

      const { error: vendorError } = await supabase
        .from('Vendor')
        .update({ status: 'approved' })
        .eq('id', existingVendor.id)

      if (userError || vendorError) {
        return NextResponse.json(
          { error: 'Failed to approve vendor' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { message: 'Vendor approved successfully' },
        { status: 200 }
      )
    } else {
      const [userResult, vendorResult, documentsResult, shopResult] = await Promise.all([
        supabase.from('User').update({ status: 'inactive' }).eq('id', vendorUserId),
        supabase.from('Vendor').update({ status: 'rejected' }).eq('id', existingVendor.id),
        supabase.from('VendorDocument').update({ status: 'rejected', reviewNotes: rejectionReason || 'Hồ sơ shop bị từ chối; toàn bộ tài liệu bị từ chối cùng shop.' }).eq('vendorId', existingVendor.id),
        supabase.from('Shop').update({ locked: false, lockedReason: null, lockedAt: null }).eq('vendorId', existingVendor.id),
      ])

      if (userResult.error || vendorResult.error || documentsResult.error || shopResult.error) {
        return NextResponse.json(
          { error: userResult.error?.message || vendorResult.error?.message || documentsResult.error?.message || shopResult.error?.message || 'Failed to reject vendor' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { message: 'Vendor rejected successfully' },
        { status: 200 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
