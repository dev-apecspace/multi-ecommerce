import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Message {
  id: number
  conversationId: number
  senderId: number
  content: string
  isRead: boolean
  createdAt: string
}

interface UseChatOptions {
  onNewMessage?: (message: Message) => void
  onMessagesRead?: () => void
}

export function useChat(conversationId: number | null, options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { onNewMessage, onMessagesRead } = options

  // Fetch initial messages and mark as read
  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }

    const fetchMessages = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setMessages(data.messages)

        // Mark messages as read
        await fetch('/api/chat/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
        })
        
        onMessagesRead?.()
      } catch (err: any) {
        console.error('Error fetching messages:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [conversationId])

  // Realtime is used whenever the Message table is enabled in Supabase
  // Realtime. Polling remains as a safe fallback for local deployments or
  // projects where the publication has not been enabled yet.
  useEffect(() => {
    if (!conversationId) return

    const refreshMessages = async () => {
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`, { cache: 'no-store' })
        const data = await res.json()
        if (res.ok && Array.isArray(data.messages)) {
          setMessages(data.messages)
        }
      } catch {
        // Keep the currently visible messages when the connection is briefly unavailable.
      }
    }

    const intervalId = window.setInterval(refreshMessages, 10000)
    return () => window.clearInterval(intervalId)
  }, [conversationId])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => {
            // Prevent duplicates if necessary (though INSERT should be unique)
            if (prev.some(m => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
          onNewMessage?.(newMessage)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Message',
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, onNewMessage])

  const sendMessage = async (content: string) => {
    if (!conversationId) return

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.message) {
        setMessages((previous) => previous.some((message) => message.id === data.message.id)
          ? previous
          : [...previous, data.message])
      }
      return data.message
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return { messages, loading, error, sendMessage }
}
