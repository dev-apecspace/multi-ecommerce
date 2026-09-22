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

    if (approved) {
      const { data: vendor, error: vendorLookupError } = await supabase
        .from('Vendor')
        .select('id')
        .eq('userId', vendorUserId)
        .maybeSingle()
      if (vendorLookupError || !vendor) {
        return NextResponse.json({ error: 'Không tìm thấy hồ sơ shop.' }, { status: 404 })
      }

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
        .eq('userId', vendorUserId)

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
      const { error: userError } = await supabase
        .from('User')
        .update({ status: 'rejected' })
        .eq('id', vendorUserId)

      const { error: vendorError } = await supabase
        .from('Vendor')
        .update({ status: 'rejected' })
        .eq('userId', vendorUserId)

      if (userError || vendorError) {
        return NextResponse.json(
          { error: 'Failed to reject vendor' },
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
