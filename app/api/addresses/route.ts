import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const { data, error } = await supabase
      .from('Address')
      .select('*')
      .eq('userId', userId)
      .order('isDefault', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.isDefault && body.userId) {
      await supabase
        .from('Address')
        .update({ isDefault: false })
        .eq('userId', body.userId)
    }
    
    const { data, error } = await supabase.from('Address').insert([body]).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    if (!id) return NextResponse.json({ error: 'Address ID required' }, { status: 400 })

    if (body.isDefault) {
      const { data: addressData } = await supabase
        .from('Address')
        .select('userId')
        .eq('id', parseInt(id))
        .single()
      
      if (addressData) {
        await supabase
          .from('Address')
          .update({ isDefault: false })
          .eq('userId', addressData.userId)
          .neq('id', parseInt(id))
      }
    }

    const { data, error } = await supabase.from('Address').update(body).eq('id', id).select()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Address ID required' }, { status: 400 })

    const { data: addressData } = await supabase
      .from('Address')
      .select('userId, isDefault')
      .eq('id', parseInt(id))
      .single()

    const { error } = await supabase.from('Address').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (addressData?.isDefault && addressData?.userId) {
      const { data: nextAddress } = await supabase
        .from('Address')
        .select('id')
        .eq('userId', addressData.userId)
        .limit(1)
        .single()

      if (nextAddress) {
        await supabase
          .from('Address')
          .update({ isDefault: true })
          .eq('id', nextAddress.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
