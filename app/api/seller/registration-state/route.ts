import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth || auth.role !== 'vendor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: vendor, error } = await supabase.from('Vendor').select('id, name, status, createdAt')
    .eq('userId', auth.userId).order('createdAt', { ascending: false }).order('id', { ascending: false }).limit(1).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rejected: vendor?.status === 'rejected', vendorId: vendor?.id ?? null, shopName: vendor?.name ?? '' })
}
