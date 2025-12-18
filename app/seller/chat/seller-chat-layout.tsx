'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChatList, Conversation } from '@/components/chat/chat-list'
import { ChatWindow } from '@/components/chat/chat-window'
import { useSearchParams, useRouter } from 'next/navigation'
import { useRealtimeConversation } from '@/hooks/use-realtime-conversation'
import { Loader2 } from 'lucide-react'

export function SellerChatLayout({ userId }: { userId: number }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialConvId = searchParams.get('conversationId')
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(initialConvId ? parseInt(initialConvId) : null)
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/seller/chat/conversations')
      const data = await res.json()
      if (data.conversations) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Failed to fetch conversations', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations, initialConvId])

  useRealtimeConversation({
    vendorId: userId,
    onUpdate: fetchConversations
  })

  const handleSelectConversation = (id: number) => {
    setSelectedId(id)
    router.push(`/seller/chat?conversationId=${id}`, { scroll: false })
  }

  const selectedConversation = conversations.find(c => c.id === selectedId)

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-100px)]">
      <h1 className="text-2xl font-bold mb-4">Tin nhắn từ khách hàng</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Sidebar List */}
        <div className="border rounded-lg bg-background overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="font-semibold">Cuộc trò chuyện</h2>
          </div>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChatList 
              conversations={conversations} 
              selectedId={selectedId} 
              onSelect={handleSelectConversation}
              mode="seller"
            />
          )}
        </div>

        {/* Chat Window */}
        <div className="md:col-span-2 h-full">
          {selectedId && selectedConversation ? (
            <ChatWindow
              conversationId={selectedId}
              currentUserId={userId}
              otherPartyName={selectedConversation.User?.name || 'Customer'}
              otherPartyAvatar={selectedConversation.User?.UserProfile?.avatar}
              onMessagesRead={fetchConversations}
              className="h-full"
            />
          ) : (
            <div className="h-full border rounded-lg flex items-center justify-center bg-muted/10 text-muted-foreground">
              Chọn cuộc trò chuyện để bắt đầu
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
