import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const vendorId = auth.vendorId
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const { data: documents, error: docError, count } = await supabase
      .from('VendorDocument')
      .select('*', { count: 'exact' })
      .eq('vendorId', vendorId)
      .order('uploadedAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      data: documents,
      pagination: {
        total: count,
        limit,
        offset,
      },
      vendorId: vendorId
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const { data: vendor, error: vendorError } = await supabase.from('Vendor').select('status').eq('id', auth.vendorId).maybeSingle()
    if (vendorError) return NextResponse.json({ error: vendorError.message }, { status: 400 })
    if (vendor?.status === 'rejected') return NextResponse.json({ error: 'Shop đã bị từ chối; không thể nộp hoặc thay thế hồ sơ.' }, { status: 409 })

    const body = await request.json()
    const { documentName, documentUrl } = body
    const documentType = String(body.documentType || '').trim()

    if (!documentName || !documentUrl || !documentType) {
      return NextResponse.json(
        { error: 'documentType, documentName and documentUrl are required' },
        { status: 400 }
      )
    }

    const { data: approvedDocument, error: approvedCheckError } = await supabase
      .from('VendorDocument')
      .select('id')
      .eq('vendorId', auth.vendorId)
      .eq('status', 'approved')
      .limit(1)
      .maybeSingle()

    if (approvedCheckError) return NextResponse.json({ error: approvedCheckError.message }, { status: 400 })
    if (approvedDocument) {
      return NextResponse.json({ error: 'Hồ sơ của shop đã được duyệt, bạn không thể tải thêm hoặc thay thế hồ sơ.' }, { status: 409 })
    }

    const { data: existingDocuments, error: existingError } = await supabase
      .from('VendorDocument')
      .select('id')
      .eq('vendorId', auth.vendorId)
      .eq('documentType', documentType)
      .neq('status', 'approved')
      .order('uploadedAt', { ascending: false })
    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 })

    let document: any[] | null = null
    let docError: any = null
    const replacement = {
      documentName,
      documentUrl,
      documentType,
      status: 'pending',
      reviewNotes: null,
      uploadedAt: new Date().toISOString(),
    }
    if (existingDocuments?.length) {
      const [latest, ...duplicates] = existingDocuments
      const updated = await supabase.from('VendorDocument').update(replacement).eq('id', latest.id).eq('vendorId', auth.vendorId).select()
      document = updated.data
      docError = updated.error
      if (!docError && duplicates.length) {
        const cleanup = await supabase.from('VendorDocument').delete().in('id', duplicates.map((item: any) => item.id)).eq('vendorId', auth.vendorId).neq('status', 'approved')
        if (cleanup.error) return NextResponse.json({ error: cleanup.error.message }, { status: 400 })
      }
    } else {
      const inserted = await supabase.from('VendorDocument').insert([{ vendorId: auth.vendorId, ...replacement }]).select()
      document = inserted.data
      docError = inserted.error
    }

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 400 })
    }

    return NextResponse.json(document?.[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const { data: document } = await supabase
      .from('VendorDocument')
      .select('vendorId, status, documentType')
      .eq('id', documentId)
      .maybeSingle()

    if (!document || document.vendorId !== auth.vendorId) {
      return NextResponse.json(
        { error: 'Unauthorized: Document does not belong to this vendor' },
        { status: 403 }
      )
    }

    const { data: vendor, error: vendorError } = await supabase.from('Vendor').select('status').eq('id', auth.vendorId).maybeSingle()
    if (vendorError) return NextResponse.json({ error: vendorError.message }, { status: 400 })
    if (vendor?.status === 'rejected') return NextResponse.json({ error: 'Shop đã bị từ chối; không thể thay đổi hồ sơ.' }, { status: 409 })

    if (document.status === 'approved') {
      return NextResponse.json({ error: 'Không thể xóa hồ sơ đã được duyệt.' }, { status: 409 })
    }
    if (/giấy phép kinh doanh|gpkd|chứng minh tài khoản ngân hàng chính chủ/i.test(document.documentType || '')) {
      return NextResponse.json({ error: 'Hai hồ sơ bắt buộc mặc định không được xóa. Hãy tải tệp mới để thay thế.' }, { status: 409 })
    }

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
