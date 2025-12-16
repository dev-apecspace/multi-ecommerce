"use client"

import { useEffect, useState } from "react"
import { Search, Send, Phone, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useLoading } from "@/hooks/use-loading"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/pagination"

interface ChatConversation {
  id: number
  userId: number
  lastMessage: string
  status: string
  unreadCount?: number
  User?: { name: string } | null
}

export default function SellerChatPage() {
  const { user } = useAuth()
  const { setIsLoading } = useLoading()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const pagination = usePagination({ initialPage: 1, initialLimit: 20 })

  useEffect(() => {
    if (user?.vendorId) {
      fetchConversations()
    }
  }, [user?.vendorId, pagination.page, pagination.limit])

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      setLoading(true)
      const url = new URL('/api/seller/chat', typeof window !== 'undefined' ? window.location.origin : '')
      url.searchParams.append('limit', pagination.limit.toString())
      url.searchParams.append('offset', pagination.offset.toString())

      const response = await fetch(url.toString())
      const result = await response.json()
      
      if (response.ok) {
        setConversations(result.data || [])
        pagination.setTotal(result.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-center">Đang tải cuộc hội thoại...</p>
      </main>
    )
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Chat với khách</h1>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách cuộc hội thoại</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có cuộc hội thoại nào
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 rounded border cursor-pointer transition hover:bg-muted ${selectedConversation === conv.id ? 'border-orange-500 bg-orange-50' : 'border-transparent'}`}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{conv.User?.name || 'Khách hàng'}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className={`w-2 h-2 rounded-full ${conv.status === "online" ? "bg-green-500" : "bg-gray-300"}`}></div>
                      {conv.unreadCount && conv.unreadCount > 0 && (
                        <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {conversations.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                limit={pagination.limit}
                onLimitChange={pagination.setPageLimit}
                total={pagination.total}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
