import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UseRealtimeConversationProps {
  userId?: number | null
  vendorId?: number | null
  onUpdate?: () => void
}

export function useRealtimeConversation({ userId, vendorId, onUpdate }: UseRealtimeConversationProps) {
  useEffect(() => {
    if (!userId && !vendorId) return

    let channelName = ''
    
    if (userId) {
      channelName = `conversations-user-${userId}`
    } else if (vendorId) {
      channelName = `conversations-vendor-${vendorId}`
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
        },
        (payload) => {
          if (onUpdate) {
            onUpdate()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Message',
        },
        (payload) => {
          if (onUpdate) {
            onUpdate()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Conversation',
        },
        (payload) => {
          if (onUpdate) {
            onUpdate()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Conversation',
        },
        (payload) => {
          if (onUpdate) {
            onUpdate()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, vendorId, onUpdate])
}
