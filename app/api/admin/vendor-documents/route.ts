import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const status = searchParams.get('status')

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 })
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
    const body = await request.json()

    if (!body.vendorId || !body.documentType || !body.documentName || !body.documentUrl) {
      return NextResponse.json(
        { error: 'vendorId, documentType, documentName, and documentUrl are required' },
        { status: 400 }
      )
    }

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
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')
    const body = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
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
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
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
