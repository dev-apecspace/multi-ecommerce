import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) return unauthorizedResponse()
    const { orderId } = await request.json()
    if (!Number.isInteger(orderId) || orderId < 1) {
      return NextResponse.json({ error: 'Đơn hàng không hợp lệ.' }, { status: 400 })
    }
    const { data: order, error: orderError } = await supabase.from('Order')
      .select('userId, status, paymentStatus').eq('id', orderId).eq('vendorId', auth.vendorId!).single()
    if (orderError || !order) return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 })
    if (order.status !== 'cancelled' || order.paymentStatus !== 'paid') {
      return NextResponse.json({ error: 'Chỉ liên hệ hoàn tiền cho đơn đã hủy và đã thanh toán.' }, { status: 400 })
    }
    // The unique customer/shop pair reuses existing chats, including concurrent requests.
    const { error } = await supabase.from('Conversation').upsert(
      { userId: order.userId, vendorId: auth.vendorId },
      { onConflict: 'userId,vendorId', ignoreDuplicates: true }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    const { data: conversation, error: lookupError } = await supabase.from('Conversation')
      .select('id').eq('userId', order.userId).eq('vendorId', auth.vendorId!).single()
    if (lookupError || !conversation) return NextResponse.json({ error: 'Không thể mở chat với khách.' }, { status: 400 })
    return NextResponse.json({ conversation })
  } catch {
    return NextResponse.json({ error: 'Không thể mở chat với khách.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const vendorId = auth.vendorId

    const { data: conversations, error } = await supabase
      .from('Conversation')
      .select(`
        *,
        User (
          id,
          name,
          email,
          UserProfile (
            avatar
          )
        )
      `)
      .eq('vendorId', vendorId)
      .order('updatedAt', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Fetch unread count and last message for each conversation
    const conversationsWithData = await Promise.all(
      conversations.map(async (conv) => {
        const { count } = await supabase
          .from('Message')
          .select('*', { count: 'exact', head: true })
          .eq('conversationId', conv.id)
          .eq('isRead', false)
          .neq('senderId', auth.userId)
        
        const { data: messages } = await supabase
          .from('Message')
          .select('content, createdAt, isRead, senderId')
          .eq('conversationId', conv.id)
          .order('createdAt', { ascending: false })
          .limit(1)
        
        return {
          ...conv,
          unreadCount: count || 0,
          lastMessage: messages && messages.length > 0 ? messages[0] : null
        }
      })
    )

    return NextResponse.json({ conversations: conversationsWithData })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
