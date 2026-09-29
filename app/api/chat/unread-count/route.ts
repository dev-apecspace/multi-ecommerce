import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return unauthorizedResponse()
  const mode = new URL(request.url).searchParams.get('mode') || 'client'
  if (!['client', 'seller'].includes(mode)) return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  if (mode === 'seller' && !isVendor(auth)) return unauthorizedResponse()
  const { count, error } = await supabase.from('Message')
    .select('id, Conversation!inner(userId, vendorId)', { count: 'exact', head: true })
    .eq('isRead', false)
    .neq('senderId', auth.userId)
    .eq(mode === 'seller' ? 'Conversation.vendorId' : 'Conversation.userId', mode === 'seller' ? auth.vendorId! : auth.userId)
  if (error) return NextResponse.json({ error: 'Không thể tải số tin nhắn chưa đọc.' }, { status: 500 })
  return NextResponse.json({ count: count || 0 }, { headers: { 'Cache-Control': 'no-store' } })
}
