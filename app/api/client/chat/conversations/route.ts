import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return unauthorizedResponse()
    }

    const userId = auth.userId

    // Fetch conversations for this user
    const { data: conversations, error } = await supabase
      .from('Conversation')
      .select(`
        *,
        Vendor (
          id,
          name,
          logo,
          User (
            name,
            email
          )
        )
      `)
      .eq('userId', userId)
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
          .neq('senderId', userId)
        
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

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return unauthorizedResponse()
    }

    const userId = auth.userId
    const body = await request.json()
    const { vendorId } = body

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('Conversation')
      .select('id')
      .eq('userId', userId)
      .eq('vendorId', vendorId)
      .single()

    if (existing) {
      return NextResponse.json({ conversation: existing })
    }

    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from('Conversation')
      .insert([{ userId, vendorId }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ conversation: newConversation })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
