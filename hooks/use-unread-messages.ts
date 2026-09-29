"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useUnreadMessages(mode: 'client' | 'seller', userId?: string | number | null) {
  const [state, setState] = useState({ key: '', count: 0 })
  const key = userId ? `${mode}:${userId}` : ''

  useEffect(() => {
    if (!key) return
    let disposed = false
    let controller: AbortController | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = async () => {
      controller?.abort()
      controller = new AbortController()
      try {
        const response = await fetch(`/api/chat/unread-count?mode=${mode}`, { cache: 'no-store', signal: controller.signal })
        const data = await response.json()
        if (!disposed && response.ok && Number.isInteger(data.count) && data.count >= 0) {
          setState({ key, count: data.count })
        }
      } catch { /* Retry on the next realtime event or polling interval. */ }
    }
    const scheduleRefresh = () => {
      clearTimeout(timer)
      timer = setTimeout(refresh, 150)
    }
    void refresh()
    const channel = supabase.channel(`unread-${key}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Message' }, scheduleRefresh)
      .subscribe()
    // Fallback when database realtime is unavailable; also refresh after reading a chat.
    const interval = setInterval(refresh, 15000)
    window.addEventListener('focus', scheduleRefresh)
    window.addEventListener('chat:messages-read', scheduleRefresh)
    return () => {
      disposed = true
      controller?.abort()
      clearTimeout(timer)
      clearInterval(interval)
      window.removeEventListener('focus', scheduleRefresh)
      window.removeEventListener('chat:messages-read', scheduleRefresh)
      void supabase.removeChannel(channel)
    }
  }, [key, mode])

  return state.key === key ? state.count : 0
}
