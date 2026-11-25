import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(await getAuthFromRequest(request))) return unauthorizedResponse()
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const status = searchParams.get('status')

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 })
    }

    const { data: vendor, error: vendorError } = await supabase.from('Vendor').select('status').eq('id', vendorId).maybeSingle()
    if (vendorError) return NextResponse.json({ error: vendorError.message }, { status: 400 })
    if (vendor?.status === 'rejected') {
      const { error: syncError } = await supabase.from('VendorDocument')
        .update({ status: 'rejected', reviewNotes: 'Shop đã bị từ chối; toàn bộ tài liệu bị từ chối cùng shop.' })
        .eq('vendorId', vendorId)
        .neq('status', 'rejected')
      if (syncError) return NextResponse.json({ error: syncError.message }, { status: 400 })
      const { error: unlockError } = await supabase.from('Shop')
        .update({ locked: false, lockedReason: null, lockedAt: null })
        .eq('vendorId', vendorId)
      if (unlockError) return NextResponse.json({ error: unlockError.message }, { status: 400 })
    }

    let query = supabase
      .from('VendorDocument')
      .select('*')
      .eq('vendorId', vendorId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('uploadedAt', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(await getAuthFromRequest(request))) return unauthorizedResponse()
    const body = await request.json()

    if (!body.vendorId || !body.documentType || !body.documentName || !body.documentUrl) {
      return NextResponse.json(
        { error: 'vendorId, documentType, documentName, and documentUrl are required' },
        { status: 400 }
      )
    }

    const { data: vendor, error: vendorError } = await supabase.from('Vendor').select('status').eq('id', body.vendorId).maybeSingle()
    if (vendorError) return NextResponse.json({ error: vendorError.message }, { status: 400 })
    if (vendor?.status === 'rejected') return NextResponse.json({ error: 'Shop đã bị từ chối; không thể thêm hồ sơ.' }, { status: 409 })

    const { data, error } = await supabase
      .from('VendorDocument')
      .insert([{
        vendorId: body.vendorId,
        documentType: body.documentType,
        documentName: body.documentName,
        documentUrl: body.documentUrl,
        status: 'pending',
      }])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdmin(await getAuthFromRequest(request))) return unauthorizedResponse()
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')
    const body = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    const { data: document, error: documentError } = await supabase.from('VendorDocument')
      .select('vendorId')
      .eq('id', documentId)
      .maybeSingle()
    if (documentError) return NextResponse.json({ error: documentError.message }, { status: 400 })
    if (!document) return NextResponse.json({ error: 'Không tìm thấy tài liệu.' }, { status: 404 })
    const { data: vendor, error: vendorError } = await supabase.from('Vendor')
      .select('status')
      .eq('id', document.vendorId)
      .maybeSingle()
    if (vendorError) return NextResponse.json({ error: vendorError.message }, { status: 400 })
    if (vendor?.status === 'rejected') {
      return NextResponse.json({ error: 'Shop đã bị từ chối; không thể duyệt hoặc thay đổi tài liệu.' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('VendorDocument')
      .update(body)
      .eq('id', documentId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdmin(await getAuthFromRequest(request))) return unauthorizedResponse()
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    const { data: document, error: documentError } = await supabase.from('VendorDocument').select('vendorId').eq('id', documentId).maybeSingle()
    if (documentError) return NextResponse.json({ error: documentError.message }, { status: 400 })
    if (!document) return NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404 })
    const { data: vendor, error: vendorError } = await supabase.from('Vendor').select('status').eq('id', document.vendorId).maybeSingle()
    if (vendorError) return NextResponse.json({ error: vendorError.message }, { status: 400 })
    if (vendor?.status === 'rejected') return NextResponse.json({ error: 'Shop đã bị từ chối; không thể xóa hồ sơ khỏi lịch sử.' }, { status: 409 })

    const { error } = await supabase
      .from('VendorDocument')
      .delete()
      .eq('id', documentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
