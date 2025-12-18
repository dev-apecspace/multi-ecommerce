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

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Verify participation
    const { data: conversation, error: convError } = await supabase
      .from('Conversation')
      .select('userId, vendorId')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const isParticipant = 
      conversation.userId === auth.userId || 
      conversation.vendorId === auth.vendorId

    if (!isParticipant) {
      return unauthorizedResponse()
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('Message')
      .select('*')
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ messages })
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

    const body = await request.json()
    const { conversationId, content } = body

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify participation
    const { data: conversation, error: convError } = await supabase
      .from('Conversation')
      .select('userId, vendorId')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const isParticipant = 
      conversation.userId === auth.userId || 
      conversation.vendorId === auth.vendorId

    if (!isParticipant) {
      return unauthorizedResponse()
    }

    // Send message
    const { data: message, error } = await supabase
      .from('Message')
      .insert([{
        conversationId,
        senderId: auth.userId, // Always use the authenticated user's ID
        content,
        isRead: false
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Update conversation timestamp
    await supabase
      .from('Conversation')
      .update({ updatedAt: new Date().toISOString() })
      .eq('id', conversationId)

    return NextResponse.json({ message })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { conversationId } = body

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Verify participation
    const { data: conversation, error: convError } = await supabase
      .from('Conversation')
      .select('userId, vendorId')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const isParticipant = 
      conversation.userId === auth.userId || 
      conversation.vendorId === auth.vendorId

    if (!isParticipant) {
      return unauthorizedResponse()
    }

    // Mark all unread messages as read (except those sent by the current user)
    const { error } = await supabase
      .from('Message')
      .update({ isRead: true })
      .eq('conversationId', conversationId)
      .eq('isRead', false)
      .neq('senderId', auth.userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
