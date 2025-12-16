'use client'

import { useEffect, useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface Review {
  id: number
  productId: number
  userId: number
  rating: number
  comment?: string
  createdAt: string
  User?: {
    id: number
    name: string
    email: string
  }
}

interface ReviewListProps {
  productId: number
  currentUserId?: number
  onReviewDeleted?: () => void
}

export function ReviewList({
  productId,
  currentUserId,
  onReviewDeleted,
}: ReviewListProps) {
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState(0)

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews?productId=${productId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews')
      }

      setReviews(data.data || [])

      if (data.data && data.data.length > 0) {
        const avg =
          data.data.reduce((sum: number, review: Review) => sum + review.rating, 0) /
          data.data.length
        setAvgRating(avg)
      } else {
        setAvgRating(0)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      return
    }

    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review')
      }

      toast({
        title: 'Thành công',
        description: 'Đánh giá đã được xóa',
      })

      setReviews(reviews.filter((r) => r.id !== reviewId))
      onReviewDeleted?.()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể xóa đánh giá',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Đang tải đánh giá...</div>
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chưa có đánh giá nào
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                className={`${
                  i < Math.round(avgRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {avgRating.toFixed(1)} / 5.0 ({reviews.length} đánh giá)
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">
                  {review.User?.name || 'Khách hàng ẩn danh'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              {currentUserId === review.userId && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteReview(review.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>

            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={`${
                    i < review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>

            {review.comment && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {review.comment}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
