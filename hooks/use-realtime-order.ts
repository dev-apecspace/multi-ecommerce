import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface UseRealtimeOrderProps {
  userId?: number | null
  orderId?: number | null
  vendorId?: number | null
  onUpdate?: () => void
}

export function useRealtimeOrder({ userId, orderId, vendorId, onUpdate }: UseRealtimeOrderProps) {
  const router = useRouter()
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (!userId && !orderId && !vendorId) return

    let filter = ''
    let channelName = ''

    if (orderId) {
      filter = `id=eq.${orderId}`
      channelName = `order-${orderId}`
    } else if (userId) {
      filter = `userId=eq.${userId}`
      channelName = `orders-user-${userId}`
    } else if (vendorId) {
      filter = `vendorId=eq.${vendorId}`
      channelName = `orders-vendor-${vendorId}`
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Order',
          filter: filter,
        },
        (payload) => {
          console.log('Order inserted:', payload)
          if (onUpdateRef.current) {
            onUpdateRef.current()
          } else {
            router.refresh()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Order',
          filter: filter,
        },
        (payload) => {
          console.log('Order updated:', payload)
          if (onUpdateRef.current) {
            onUpdateRef.current()
          } else {
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, orderId, vendorId, router])
}
