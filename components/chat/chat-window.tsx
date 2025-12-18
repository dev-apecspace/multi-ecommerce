'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat } from '@/hooks/use-chat'
import { useNotification } from '@/hooks/use-notification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Loader2, Bell, BellOff, Check, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatWindowProps {
  conversationId: number
  currentUserId: number
  otherPartyName: string
  otherPartyAvatar?: string | null
  className?: string
  onMessagesRead?: () => void
}

export function ChatWindow({
  conversationId,
  currentUserId,
  otherPartyName,
  otherPartyAvatar,
  className,
  onMessagesRead
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { showNotification, requestPermission } = useNotification({
    title: `Message from ${otherPartyName}`,
    enabled: notificationsEnabled,
  })

  const handleNewMessage = useCallback((message: any) => {
    if (message.senderId !== currentUserId) {
      if (notificationsEnabled) {
        showNotification(message.content, otherPartyName)
      }
      
      fetch('/api/chat/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      }).catch(err => console.error('Failed to mark as read:', err))
    }
  }, [currentUserId, notificationsEnabled, showNotification, otherPartyName, conversationId])

  const { messages, loading, sendMessage } = useChat(conversationId, { 
    onNewMessage: handleNewMessage,
    onMessagesRead
  })

  const toggleNotifications = useCallback(async () => {
    if (!notificationsEnabled) {
      const granted = await requestPermission()
      if (granted) {
        setNotificationsEnabled(true)
      }
    } else {
      setNotificationsEnabled(false)
    }
  }, [notificationsEnabled, requestPermission])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      await sendMessage(newMessage)
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={cn("flex flex-col h-full border rounded-lg overflow-hidden bg-background", className)}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherPartyAvatar || undefined} />
            <AvatarFallback>{otherPartyName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherPartyName}</h3>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleNotifications}
          title={notificationsEnabled ? 'Bật thông báo' : 'Tắt thông báo'}
        >
          {notificationsEnabled ? (
            <Bell className="h-4 w-4 text-orange-500" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {loading && messages.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full gap-2",
                    isMe ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p>{msg.content}</p>
                    <div className={cn(
                      "text-[10px] mt-1 flex items-center gap-1 opacity-70",
                      isMe ? "text-primary-foreground justify-end" : "text-muted-foreground justify-start"
                    )}>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        msg.isRead ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1"
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
