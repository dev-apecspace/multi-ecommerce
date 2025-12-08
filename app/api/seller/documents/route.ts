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

    const { data: documents, error: docError } = await supabase
      .from('VendorDocument')
      .select('*')
      .eq('vendorId', vendorId)
      .order('uploadedAt', { ascending: false })

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      data: documents,
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

    const body = await request.json()
    const { documentName, documentUrl, documentType } = body

    if (!documentName || !documentUrl) {
      return NextResponse.json(
        { error: 'documentName and documentUrl are required' },
        { status: 400 }
      )
    }

    const { data: document, error: docError } = await supabase
      .from('VendorDocument')
      .insert([{
        vendorId: auth.vendorId,
        documentType: documentType || 'other',
        documentName,
        documentUrl,
        status: 'pending',
      }])
      .select()

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 400 })
    }

    return NextResponse.json(document[0], { status: 201 })
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
      .select('vendorId')
      .eq('id', documentId)
      .maybeSingle()

    if (!document || document.vendorId !== auth.vendorId) {
      return NextResponse.json(
        { error: 'Unauthorized: Document does not belong to this vendor' },
        { status: 403 }
      )
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
