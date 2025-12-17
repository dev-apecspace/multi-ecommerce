import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface UseRealtimeReturnProps {
  userId?: number | null
  returnId?: number | null
  vendorId?: number | null
  onUpdate?: () => void
}

export function useRealtimeReturn({ userId, returnId, vendorId, onUpdate }: UseRealtimeReturnProps) {
  const router = useRouter()

  useEffect(() => {
    if (!userId && !returnId && !vendorId) return

    let filter = ''
    let channelName = ''

    if (returnId) {
      filter = `id=eq.${returnId}`
      channelName = `return-${returnId}`
    } else if (userId) {
      filter = `userId=eq.${userId}`
      channelName = `returns-user-${userId}`
    } else if (vendorId) {
      filter = `vendorId=eq.${vendorId}`
      channelName = `returns-vendor-${vendorId}`
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Return',
          filter: filter,
        },
        (payload) => {
          console.log('Return updated:', payload)
          if (onUpdate) {
            onUpdate()
          } else {
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, returnId, vendorId, router, onUpdate])
}
