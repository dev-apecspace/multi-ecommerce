import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
          .neq('senderId', vendorId)
        
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
