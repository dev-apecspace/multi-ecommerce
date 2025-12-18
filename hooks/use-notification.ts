'use client'

import { useCallback, useRef } from 'react'

interface UseNotificationOptions {
  title?: string
  enabled?: boolean
}

export function useNotification(options: UseNotificationOptions = {}) {
  const { title = 'Tin nhắn mới', enabled = true } = options
  const audioContextRef = useRef<AudioContext | null>(null)

  const generateBeep = (frequency: number = 800, duration: number = 200) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const audioContext = audioContextRef.current
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (error) {
      console.log('Error generating beep:', error)
    }
  }

  const playSound = useCallback(() => {
    if (!enabled) return
    try {
      generateBeep(800, 150)
      setTimeout(() => generateBeep(1000, 150), 100)
    } catch (error) {
      console.log('Error playing sound:', error)
    }
  }, [enabled])

  const showNotification = useCallback((message: string, senderName?: string) => {
    if (!enabled) return

    playSound()

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: `${senderName || 'Ai đó'}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          icon: '/icon.svg',
          tag: 'chat-notification',
          requireInteraction: false,
        })
      } catch (error) {
        console.log('Error showing notification:', error)
      }
    }
  }, [enabled, title, playSound])

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      } catch (error) {
        console.log('Error requesting notification permission:', error)
        return false
      }
    }
    return Notification.permission === 'granted'
  }, [])

  return { showNotification, requestPermission, playSound }
}
