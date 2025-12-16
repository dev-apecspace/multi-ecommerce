'use client'

import { useEffect, useState } from 'react'
import { Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useLoading } from '@/hooks/use-loading'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  productId: number
  productName: string
  orderId: number
  reviewId?: number | null
  initialRating?: number | null
  initialComment?: string | null
  onReviewSubmitted?: () => void
}

export function ReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  orderId,
  reviewId = null,
  initialRating = null,
  initialComment = null,
  onReviewSubmitted,
}: ReviewModalProps) {
  const { toast } = useToast()
  const { setIsLoading } = useLoading()
  const [rating, setRating] = useState(initialRating ?? 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState(initialComment ?? '')
  const [submitting, setSubmitting] = useState(false)
  const isEditing = Boolean(reviewId)

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating ?? 0)
      setComment(initialComment ?? '')
    }
  }, [isOpen, initialRating, initialComment])

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn số sao',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    setIsLoading(true)
    try {
      const payload = isEditing
        ? {
            id: reviewId,
            rating,
            comment: comment.trim() || null,
          }
        : {
            productId,
            orderId,
            rating,
            comment: comment.trim() || null,
          }

      const response = await fetch('/api/reviews', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      toast({
        title: 'Thành công',
        description: isEditing ? 'Đánh giá của bạn đã được cập nhật' : 'Đánh giá của bạn đã được gửi',
      })

      setRating(0)
      setComment('')
      onClose()
      onReviewSubmitted?.()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể gửi đánh giá',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Chỉnh sửa đánh giá' : 'Đánh giá sản phẩm'}</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">
              Số sao <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {rating === 1 && 'Rất tệ'}
                {rating === 2 && 'Tệ'}
                {rating === 3 && 'Bình thường'}
                {rating === 4 && 'Tốt'}
                {rating === 5 && 'Rất tốt'}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Bình luận
            </label>
            <Textarea
              placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              className="resize-none"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 ký tự
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting || rating === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isEditing
                ? (submitting ? 'Đang lưu...' : 'Cập nhật đánh giá')
                : (submitting ? 'Đang gửi...' : 'Gửi đánh giá')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
