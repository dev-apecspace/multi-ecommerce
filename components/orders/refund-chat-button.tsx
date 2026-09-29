"use client"

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface RefundOrder {
  orderNumber: string
  status: string
  paymentMethod?: string
  paymentStatus?: string
  Vendor: { id: number } | null
}

export function RefundChatButton({ order, returnStatuses = [], fullWidth = false }: { order: RefundOrder; returnStatuses?: string[]; fullWidth?: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const sending = useRef(false)
  const [loading, setLoading] = useState(false)
  const [sentConversationId, setSentConversationId] = useState<number | null>(null)

  const hasReturnAwaitingRefund = returnStatuses.some(status =>
    ['pending', 'approved', 'shipped', 'received', 'restocked'].includes(status)
  )
  // Delivery alone does not qualify: a paid order must have an open return request.
  // Cancelled orders retain the separate paid/submitted-proof refund flow.
  const eligible = order.paymentStatus !== 'refunded' && (
    (order.status === 'delivered' && order.paymentStatus === 'paid' && hasReturnAwaitingRefund) ||
    (order.status === 'cancelled' && (
      ['paid', 'submitted'].includes(order.paymentStatus || '')
    ))
  )
  if (!eligible || !order.Vendor?.id) return null

  const requestRefund = async () => {
    if (sending.current) return
    if (sentConversationId) {
      router.push(`/client/chat?conversationId=${sentConversationId}`)
      return
    }
    sending.current = true
    setLoading(true)
    try {
      const response = await fetch('/api/client/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: order.Vendor!.id }),
      })
      const result = await response.json()
      if (!response.ok || !result.conversation?.id) {
        throw new Error(result.error || 'Không thể mở chat với shop.')
      }
      const conversationId = result.conversation.id
      const messageResponse = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: `Yêu cầu hoàn tiền cho đơn hàng ${order.orderNumber}. Chào shop, tôi muốn yêu cầu hoàn tiền cho đơn hàng này. Nhờ shop kiểm tra và hướng dẫn giúp tôi.`,
        }),
      })
      const messageResult = await messageResponse.json()
      if (!messageResponse.ok) throw new Error(messageResult.error || 'Chưa gửi được yêu cầu hoàn tiền. Vui lòng thử lại.')
      setSentConversationId(conversationId)
      toast({ title: 'Đã gửi yêu cầu hoàn tiền', description: 'Bạn có thể trao đổi tiếp với shop trong chat.' })
      router.push(`/client/chat?conversationId=${conversationId}`)
    } catch (error) {
      toast({ title: 'Không thể gửi yêu cầu', description: error instanceof Error ? error.message : 'Vui lòng thử lại.', variant: 'destructive' })
    } finally {
      sending.current = false
      setLoading(false)
    }
  }

  return <Button variant="outline" size={fullWidth ? 'default' : 'sm'} className={fullWidth ? 'w-full' : undefined} disabled={loading} onClick={requestRefund}>
    {loading ? 'Đang gửi...' : sentConversationId ? 'Mở chat với shop' : 'Yêu cầu hoàn tiền'}
  </Button>
}
