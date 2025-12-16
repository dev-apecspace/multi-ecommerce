"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useLoading } from "@/hooks/use-loading"
import { CreateReturnModal } from "@/components/returns/create-return-modal"
import { ReturnStatusModal } from "@/components/returns/return-status-modal"
import { ReviewModal } from "@/components/review/review-modal"

interface Order {
  id: number
  orderNumber: string
  status: string
  total: number
  shippingCost: number
  date: string
  updatedAt: string
  Vendor: { id: number; name: string }
  OrderItem: Array<{
    id: number
    quantity: number
    price: number
    vendorId: number
    variantId: number | null
    variantName?: string | null
    Product: { id: number; name: string; image?: string }
    ProductVariant?: { id: number; name: string } | null
  }>
}

interface ReturnModalState {
  open: boolean
  orderId: number | null
  orderItemId: number | null
  productId: number | null
  variantId: number | null
  productName: string
  productImage?: string
  quantity: number
  price: number
}

const isReturnable = (order: Order) => {
  if (order.status !== 'delivered') return false
  const deliveryDate = new Date(order.updatedAt)
  const currentDate = new Date()
  const diffTime = Math.abs(currentDate.getTime() - deliveryDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 3
}

export default function OrderHistoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { setIsLoading } = useLoading()
  const [userId, setUserId] = useState<number | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)
  const [returnStatuses, setReturnStatuses] = useState<Record<number, string>>({})
  const [returnModal, setReturnModal] = useState<ReturnModalState>({
    open: false,
    orderId: null,
    orderItemId: null,
    productId: null,
    variantId: null,
    productName: '',
    productImage: '',
    quantity: 1,
    price: 0
  })
  const [returnStatusModal, setReturnStatusModal] = useState({
    open: false,
    orderItemId: 0
  })
  const [reviewModal, setReviewModal] = useState<{
    open: boolean
    productId: number | null
    productName: string
    orderId: number | null
    reviewId: number | null
    initialRating: number | null
    initialComment: string | null
  }>({
    open: false,
    productId: null,
    productName: '',
    orderId: null,
    reviewId: null,
    initialRating: null,
    initialComment: null
  })
  const [reviewsMap, setReviewsMap] = useState<Record<string, { id: number; rating: number; comment: string | null; createdAt: string }>>({})
  
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id)
    } else {
      const storedUserId = localStorage.getItem('userId')
      if (storedUserId) {
        setUserId(parseInt(storedUserId))
      }
    }
  }, [user])

  useEffect(() => {
    if (userId) {
      fetchOrders()
      fetchReturnStatuses(userId)
      fetchUserReviews(userId)
    }
  }, [userId])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setIsLoading(true)
      const response = await fetch(`/api/client/orders?userId=${userId}`)
      const result = await response.json()
      setOrders(result.data || [])
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể tải lịch sử đơn hàng', variant: 'destructive' })
    } finally {
      setLoading(false)
      setIsLoading(false)
    }
  }

  const fetchReturnStatuses = async (currentUserId: number) => {
    try {
      const response = await fetch(`/api/client/returns?userId=${currentUserId}&limit=200`)
      if (!response.ok) {
        setReturnStatuses({})
        return
      }
      const result = await response.json()
      const map: Record<number, string> = {}
      if (Array.isArray(result.data)) {
        result.data.forEach((ret: any) => {
          if (ret?.orderItemId && ret.status && ret.status !== 'rejected' && ret.status !== 'cancelled') {
            map[ret.orderItemId] = ret.status
          }
        })
      }
      setReturnStatuses(map)
    } catch {
      setReturnStatuses({})
    }
  }

  const fetchUserReviews = async (currentUserId: number) => {
    try {
      const response = await fetch(`/api/reviews?userId=${currentUserId}`)
      if (!response.ok) {
        setReviewsMap({})
        return
      }
      const result = await response.json()
      const map: Record<string, { id: number; rating: number; comment: string | null; createdAt: string }> = {}
      if (Array.isArray(result.data)) {
        result.data.forEach((review: any) => {
          if (review?.orderId && review?.productId) {
            const key = `${review.orderId}-${review.productId}`
            map[key] = {
              id: review.id,
              rating: review.rating,
              comment: review.comment || null,
              createdAt: review.createdAt
            }
          }
        })
      }
      setReviewsMap(map)
    } catch {
      setReviewsMap({})
    }
  }

  const handleCancelOrder = async (orderId: number) => {
    try {
      setCancellingOrderId(orderId)
      const response = await fetch(`/api/client/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'cancelled' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Lỗi hủy đơn hàng')
      }

      toast({ title: 'Thành công', description: 'Đơn hàng đã được hủy' })
      fetchOrders()
    } catch (error) {
      toast({ title: 'Lỗi', description: error instanceof Error ? error.message : 'Không thể hủy đơn hàng', variant: 'destructive' })
    } finally {
      setCancellingOrderId(null)
    }
  }

  const handleOpenReturnModal = (orderId: number, item: any) => {
    if (returnStatuses[item.id]) {
      toast({ title: 'Thông báo', description: 'Đã gửi yêu cầu đổi/trả cho sản phẩm này' })
      return
    }

    const displayImage = item.ProductVariant?.image || item.Product?.image || '/placeholder.svg'
    const productName = (item.variantName || item.ProductVariant)
      ? `${item.Product.name} - ${item.variantName || item.ProductVariant?.name}`
      : item.Product.name
    
    setReturnModal({
      open: true,
      orderId,
      orderItemId: item.id,
      productId: item.Product.id,
      variantId: item.variantId,
      productName,
      productImage: displayImage,
      quantity: item.quantity,
      price: item.price
    })
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Chờ tiếp nhận", color: "bg-gray-100 text-gray-800" },
    processing: { label: "Đã duyệt", color: "bg-blue-100 text-blue-800" },
    shipped: { label: "Đang giao", color: "bg-yellow-100 text-yellow-800" },
    delivered: { label: "Đã giao", color: "bg-green-100 text-green-800" },
    completed: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-800" },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
    return_requested: { label: "Đã gửi yêu cầu đổi/trả hàng", color: "bg-purple-100 text-purple-800" },
    returned: { label: "Đã đổi trả", color: "bg-indigo-100 text-indigo-800" }
  }

  const canReviewOrder = (order: Order) => order.status === 'completed'

  const getProductDisplayName = (item: Order['OrderItem'][number]) => {
    const variantLabel = item.variantName || item.ProductVariant?.name
    return variantLabel ? `${item.Product.name} - ${variantLabel}` : item.Product.name
  }

  const handleOpenReviewModal = (
    orderId: number,
    item: Order['OrderItem'][number],
    existingReview?: { id: number; rating: number; comment: string | null }
  ) => {
    setReviewModal({
      open: true,
      productId: item.Product.id,
      productName: getProductDisplayName(item),
      orderId,
      reviewId: existingReview?.id ?? null,
      initialRating: existingReview?.rating ?? null,
      initialComment: existingReview?.comment ?? null
    })
  }

  const getOrderStatusKey = (order: Order) => {
    const statuses = order.OrderItem
      .map((item) => returnStatuses[item.id])
      .filter((status): status is string => Boolean(status))

    if (order.status === 'returned' || statuses.some((status) => status === 'completed')) {
      return 'returned'
    }

    if (statuses.some((status) => status !== 'completed')) {
      return 'return_requested'
    }

    return order.status
  }

  if (loading) {
    return (
      <main className="container-viewport py-8">
        <p className="text-center">Đang tải lịch sử đơn hàng...</p>
  
      <ReviewModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ ...reviewModal, open: false })}
        productId={reviewModal.productId || 0}
        productName={reviewModal.productName}
        orderId={reviewModal.orderId || 0}
        reviewId={reviewModal.reviewId}
        initialRating={reviewModal.initialRating}
        initialComment={reviewModal.initialComment}
        onReviewSubmitted={() => {
          fetchOrders()
          if (userId) {
            fetchUserReviews(userId)
          }
        }}
      />
    </main>
    )
  }

  const allOrders = orders
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const processingOrders = orders.filter(o => o.status === 'processing')
  const shippedOrders = orders.filter(o => o.status === 'shipped')
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const completedOrders = orders.filter(o => o.status === 'completed')
  const cancelledOrders = orders.filter(o => o.status === 'cancelled')

  return (
    <main className="container-viewport py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lịch sử đơn hàng</h1>
        <p className="text-muted-foreground">Quản lý và theo dõi các đơn hàng của bạn</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tất cả ({allOrders.length})</TabsTrigger>
          <TabsTrigger value="pending">Chờ tiếp nhận ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="processing">Đã duyệt ({processingOrders.length})</TabsTrigger>
          <TabsTrigger value="shipped">Đang giao ({shippedOrders.length})</TabsTrigger>
          <TabsTrigger value="delivered">Đã giao ({deliveredOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Hoàn thành ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Đã hủy ({cancelledOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {allOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Bạn chưa có đơn hàng nào
              </CardContent>
            </Card>
          ) : (
            allOrders.map((order) => {
              const statusKey = getOrderStatusKey(order)
              const statusData = statusConfig[statusKey] || statusConfig.pending
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-lg">{order.orderNumber}</p>
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${statusData.color}`}>
                            {statusData.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">{order.total.toLocaleString('vi-VN')}₫</p>
                        <p className="text-xs text-muted-foreground">{order.OrderItem.length} sản phẩm</p>
                      </div>
                    </div>
                    <div className="border-t pt-4 mb-4">
                      {order.OrderItem.map((item, idx) => {
                        const displayImage = item.ProductVariant?.image || item.Product?.image || '/placeholder.svg'
                        const reviewKey = `${order.id}-${item.Product.id}`
                        const itemReview = reviewsMap[reviewKey]
                        const showReviewButton = canReviewOrder(order) && !itemReview
                        return (
                          <div key={idx} className="flex flex-col gap-2 mb-3 pb-3 border-b last:border-b-0">
                            <div className="flex gap-3 items-start">
                              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                <Image
                                  src={displayImage}
                                  alt={item.Product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                  {item.Product.name}
                                  {(item.variantName || item.ProductVariant?.name) && ` - ${item.variantName || item.ProductVariant?.name}`}
                                </p>
                                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <p className="text-sm font-semibold whitespace-nowrap">
                                  {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                                </p>
                                {showReviewButton && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    onClick={() => handleOpenReviewModal(order.id, item)}
                                  >
                                    <Star className="h-3.5 w-3.5 mr-1" />
                                    Đánh giá
                                  </Button>
                                )}
                                {itemReview && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-xs text-orange-600 hover:text-orange-700"
                                    onClick={() => handleOpenReviewModal(order.id, item, itemReview)}
                                  >
                                    Chỉnh sửa
                                  </Button>
                                )}
                              </div>
                            </div>
                            {itemReview && (
                              <div className="ml-16 rounded-lg border border-orange-100 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 px-3 py-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                                  <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                                  {itemReview.rating}/5
                                  <span className="text-xs font-normal text-orange-500">Đã đánh giá</span>
                                </div>
                                {itemReview.comment && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{itemReview.comment}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(itemReview.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bán bởi</p>
                        <p className="text-sm font-semibold text-foreground">
                          {order.Vendor?.name || 'Đang tải...'}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/client/orders/${order.id}`)}
                      >
                        Chi tiết
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Không có đơn hàng chờ tiếp nhận
              </CardContent>
            </Card>
          ) : (
            pendingOrders.map((order) => {
              const statusKey = getOrderStatusKey(order)
              const statusData = statusConfig[statusKey] || statusConfig.pending
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-lg">{order.orderNumber}</p>
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${statusData.color}`}>
                            {statusData.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">{order.total.toLocaleString('vi-VN')}₫</p>
                        <p className="text-xs text-muted-foreground">{order.OrderItem.length} sản phẩm</p>
                      </div>
                    </div>
                    <div className="border-t pt-4 mb-4">
                      {order.OrderItem.map((item, idx) => {
                        const displayImage = item.ProductVariant?.image || item.Product?.image || '/placeholder.svg'
                        const reviewKey = `${order.id}-${item.Product.id}`
                        const itemReview = reviewsMap[reviewKey]
                        const showReviewButton = canReviewOrder(order) && !itemReview
                        return (
                          <div key={idx} className="flex flex-col gap-2 mb-3 pb-3 border-b last:border-b-0">
                            <div className="flex gap-3 items-start">
                              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                <Image
                                  src={displayImage}
                                  alt={item.Product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                  {item.Product.name}
                                  {(item.variantName || item.ProductVariant?.name) && ` - ${item.variantName || item.ProductVariant?.name}`}
                                </p>
                                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <p className="text-sm font-semibold whitespace-nowrap">
                                  {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                                </p>
                                {showReviewButton && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    onClick={() => handleOpenReviewModal(order.id, item)}
                                  >
                                    <Star className="h-3.5 w-3.5 mr-1" />
                                    Đánh giá
                                  </Button>
                                )}
                                {itemReview && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-xs text-orange-600 hover:text-orange-700"
                                    onClick={() => handleOpenReviewModal(order.id, item, itemReview)}
                                  >
                                    Chỉnh sửa
                                  </Button>
                                )}
                              </div>
                            </div>
                            {itemReview && (
                              <div className="ml-16 rounded-lg border border-orange-100 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 px-3 py-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                                  <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                                  {itemReview.rating}/5
                                  <span className="text-xs font-normal text-orange-500">Đã đánh giá</span>
                                </div>
                                {itemReview.comment && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{itemReview.comment}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(itemReview.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bán bởi</p>
                        <p className="text-sm font-semibold text-foreground">
                          {order.Vendor?.name || 'Đang tải...'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={cancellingOrderId === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          {cancellingOrderId === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/client/orders/${order.id}`)}
                        >
                          Chi tiết
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4 mt-6">
          {processingOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Không có đơn hàng đã duyệt
              </CardContent>
            </Card>
          ) : (
            processingOrders.map((order) => {
              const statusKey = getOrderStatusKey(order)
              const statusData = statusConfig[statusKey] || statusConfig.pending
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-lg">{order.orderNumber}</p>
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${statusData.color}`}>
                            {statusData.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">{order.total.toLocaleString('vi-VN')}₫</p>
                        <p className="text-xs text-muted-foreground">{order.OrderItem.length} sản phẩm</p>
                      </div>
                    </div>
                    <div className="border-t pt-4 mb-4">
                      {order.OrderItem.map((item, idx) => {
                        const displayImage = item.ProductVariant?.image || item.Product?.image || '/placeholder.svg'
                        const reviewKey = `${order.id}-${item.Product.id}`
                        const itemReview = reviewsMap[reviewKey]
                        const showReviewButton = canReviewOrder(order) && !itemReview
                        return (
                          <div key={idx} className="flex flex-col gap-2 mb-3 pb-3 border-b last:border-b-0">
                            <div className="flex gap-3 items-start">
                              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                <Image
                                  src={displayImage}
                                  alt={item.Product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                  {item.Product.name}
                                  {(item.variantName || item.ProductVariant?.name) && ` - ${item.variantName || item.ProductVariant?.name}`}
                                </p>
                                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <p className="text-sm font-semibold whitespace-nowrap">
                                  {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                                </p>
                                {showReviewButton && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    onClick={() => handleOpenReviewModal(order.id, item)}
                                  >
                                    <Star className="h-3.5 w-3.5 mr-1" />
                                    Đánh giá
                                  </Button>
                                )}
                                {itemReview && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-xs text-orange-600 hover:text-orange-700"
                                    onClick={() => handleOpenReviewModal(order.id, item, itemReview)}
                                  >
                                    Chỉnh sửa
                                  </Button>
                                )}
                              </div>
                            </div>
                            {itemReview && (
                              <div className="ml-16 rounded-lg border border-orange-100 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 px-3 py-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                                  <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                                  {itemReview.rating}/5
                                  <span className="text-xs font-normal text-orange-500">Đã đánh giá</span>
                                </div>
                                {itemReview.comment && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{itemReview.comment}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(itemReview.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bán bởi</p>
                        <p className="text-sm font-semibold text-foreground">
                          {order.Vendor?.name || 'Đang tải...'}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/client/orders/${order.id}`)}
                      >
                        Chi tiết
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="shipped" className="space-y-4 mt-6">
          {shippedOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Không có đơn hàng đang giao
              </CardContent>
            </Card>
          ) : (
            shippedOrders.map((order) => {
              const statusKey = getOrderStatusKey(order)
              const statusData = statusConfig[statusKey] || statusConfig.pending
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-lg">{order.orderNumber}</p>
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${statusData.color}`}>
                            {statusData.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">{order.total.toLocaleString('vi-VN')}₫</p>
                        <p className="text-xs text-muted-foreground">{order.OrderItem.length} sản phẩm</p>
                      </div>
                    </div>
                    <div className="border-t pt-4 mb-4">
                      {order.OrderItem.map((item, idx) => {
                        const displayImage = item.ProductVariant?.image || item.Product?.image || '/placeholder.svg'
                        const reviewKey = `${order.id}-${item.Product.id}`
                        const itemReview = reviewsMap[reviewKey]
                        const showReviewButton = canReviewOrder(order) && !itemReview
                        return (
                          <div key={idx} className="flex flex-col gap-2 mb-3 pb-3 border-b last:border-b-0">
                            <div className="flex gap-3 items-start">
                              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                <Image
                                  src={displayImage}
                                  alt={item.Product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                  {item.Product.name}
                                  {(item.variantName || item.ProductVariant?.name) && ` - ${item.variantName || item.ProductVariant?.name}`}
                                </p>
                                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <p className="text-sm font-semibold whitespace-nowrap">
                                  {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                                </p>
                                {showReviewButton && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    onClick={() => handleOpenReviewModal(order.id, item)}
                                  >
                                    <Star className="h-3.5 w-3.5 mr-1" />
                                    Đánh giá
                                  </Button>
                                )}
                                {itemReview && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-xs text-orange-600 hover:text-orange-700"
                                    onClick={() => handleOpenReviewModal(order.id, item, itemReview)}
                                  >
                                    Chỉnh sửa
                                  </Button>
                                )}
                              </div>
                            </div>
                            {itemReview && (
                              <div className="ml-16 rounded-lg border border-orange-100 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 px-3 py-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                                  <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                                  {itemReview.rating}/5
                                  <span className="text-xs font-normal text-orange-500">Đã đánh giá</span>
                                </div>
                                {itemReview.comment && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{itemReview.comment}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(itemReview.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bán bởi</p>
                        <p className="text-sm font-semibold text-foreground">
                          {order.Vendor?.name || 'Đang tải...'}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/client/orders/${order.id}`)}
                      >
                        Chi tiết
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="delivered" className="space-y-4 mt-6">
          {deliveredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Không có đơn hàng đã giao
              </CardContent>
            </Card>
          ) : (
            deliveredOrders.map((order) => {
              const statusKey = getOrderStatusKey(order)
              const statusData = statusConfig[statusKey] || statusConfig.pending
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-lg">{order.orderNumber}</p>
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${statusData.color}`}>
                            {statusData.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">{order.total.toLocaleString('vi-VN')}₫</p>
                        <p className="text-xs text-muted-foreground">{order.OrderItem.length} sản phẩm</p>
                      </div>
                    </div>
                    <div className="border-t pt-4 mb-4">
                      {order.OrderItem.map((item, idx) => {
                        const displayImage = item.ProductVariant?.image || '/placeholder.svg'
                        const itemReturnStatus = returnStatuses[item.id]
                        const itemHasReturnRecord = Boolean(itemReturnStatus)
                        return (
                          <div key={idx} className="mb-3 pb-3 border-b last:border-b-0">
                            <div className="flex gap-3 items-start">
                              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                <Image
                                  src={displayImage}
                                  alt={item.Product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                  {item.Product.name}
                                  {(item.variantName || item.ProductVariant?.name) && ` - ${item.variantName || item.ProductVariant?.name}`}
                                </p>
                                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                              </div>
                              <p className="text-sm font-semibold whitespace-nowrap">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                            </div>
                            {isReturnable(order) && (
                              itemHasReturnRecord ? (
                                <Badge className="mt-2 inline-flex items-center bg-purple-100 text-purple-800">
                                  Đã gửi yêu cầu đổi/trả hàng
                                </Badge>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 text-blue-600 hover:text-blue-700"
                                  onClick={() => handleOpenReturnModal(order.id, item)}
                                >
                                  Trả hàng hoàn tiền
                                </Button>
                              )
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bán bởi</p>
                        <p className="text-sm font-semibold text-foreground">
                          {order.Vendor?.name || 'Đang tải...'}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/client/orders/${order.id}`)}
                      >
                        Chi tiết
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Không có đơn hàng hoàn thành
              </CardContent>
            </Card>
          ) : (
            completedOrders.map((order) => {
              const statusKey = getOrderStatusKey(order)
              const statusData = statusConfig[statusKey] || statusConfig.pending
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-lg">{order.orderNumber}</p>
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${statusData.color}`}>
                            {statusData.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">{order.total.toLocaleString('vi-VN')}₫</p>
                        <p className="text-xs text-muted-foreground">{order.OrderItem.length} sản phẩm</p>
                      </div>
                    </div>
                    <div className="border-t pt-4 mb-4">
                      {order.OrderItem.map((item, idx) => {
                        const displayImage = item.ProductVariant?.image || item.Product?.image || '/placeholder.svg'
                        const reviewKey = `${order.id}-${item.Product.id}`
                        const itemReview = reviewsMap[reviewKey]
                        const showReviewButton = canReviewOrder(order) && !itemReview
                        return (
                          <div key={idx} className="flex flex-col gap-2 mb-3 pb-3 border-b last:border-b-0">
                            <div className="flex gap-3 items-start">
                              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                <Image
                                  src={displayImage}
                                  alt={item.Product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                  {item.Product.name}
                                  {(item.variantName || item.ProductVariant?.name) && ` - ${item.variantName || item.ProductVariant?.name}`}
                                </p>
                                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <p className="text-sm font-semibold whitespace-nowrap">
                                  {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                                </p>
                                {showReviewButton && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    onClick={() => handleOpenReviewModal(order.id, item)}
                                  >
                                    <Star className="h-3.5 w-3.5 mr-1" />
                                    Đánh giá
                                  </Button>
                                )}
                                {itemReview && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-xs text-orange-600 hover:text-orange-700"
                                    onClick={() => handleOpenReviewModal(order.id, item, itemReview)}
                                  >
                                    Chỉnh sửa
                                  </Button>
                                )}
                              </div>
                            </div>
                            {itemReview && (
                              <div className="ml-16 rounded-lg border border-orange-100 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 px-3 py-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                                  <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                                  {itemReview.rating}/5
                                  <span className="text-xs font-normal text-orange-500">Đã đánh giá</span>
                                </div>
                                {itemReview.comment && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{itemReview.comment}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(itemReview.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bán bởi</p>
                        <p className="text-sm font-semibold text-foreground">
                          {order.Vendor?.name || 'Đang tải...'}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/client/orders/${order.id}`)}
                      >
                        Chi tiết
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4 mt-6">
          {cancelledOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Không có đơn hàng đã hủy
              </CardContent>
            </Card>
          ) : (
            cancelledOrders.map((order) => {
              const statusKey = getOrderStatusKey(order)
              const statusData = statusConfig[statusKey] || statusConfig.pending
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-lg">{order.orderNumber}</p>
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${statusData.color}`}>
                            {statusData.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">{order.total.toLocaleString('vi-VN')}₫</p>
                        <p className="text-xs text-muted-foreground">{order.OrderItem.length} sản phẩm</p>
                      </div>
                    </div>
                    <div className="border-t pt-4 mb-4">
                      {order.OrderItem.map((item, idx) => {
                        const displayImage = item.ProductVariant?.image || item.Product?.image || '/placeholder.svg'
                        const reviewKey = `${order.id}-${item.Product.id}`
                        const itemReview = reviewsMap[reviewKey]
                        const showReviewButton = canReviewOrder(order) && !itemReview
                        return (
                          <div key={idx} className="flex flex-col gap-2 mb-3 pb-3 border-b last:border-b-0">
                            <div className="flex gap-3 items-start">
                              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                <Image
                                  src={displayImage}
                                  alt={item.Product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                  {item.Product.name}
                                  {(item.variantName || item.ProductVariant?.name) && ` - ${item.variantName || item.ProductVariant?.name}`}
                                </p>
                                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <p className="text-sm font-semibold whitespace-nowrap">
                                  {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                                </p>
                                {showReviewButton && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    onClick={() => handleOpenReviewModal(order.id, item)}
                                  >
                                    <Star className="h-3.5 w-3.5 mr-1" />
                                    Đánh giá
                                  </Button>
                                )}
                                {itemReview && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-xs text-orange-600 hover:text-orange-700"
                                    onClick={() => handleOpenReviewModal(order.id, item, itemReview)}
                                  >
                                    Chỉnh sửa
                                  </Button>
                                )}
                              </div>
                            </div>
                            {itemReview && (
                              <div className="ml-16 rounded-lg border border-orange-100 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 px-3 py-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                                  <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                                  {itemReview.rating}/5
                                  <span className="text-xs font-normal text-orange-500">Đã đánh giá</span>
                                </div>
                                {itemReview.comment && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{itemReview.comment}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(itemReview.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bán bởi</p>
                        <p className="text-sm font-semibold text-foreground">
                          {order.Vendor?.name || 'Đang tải...'}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/client/orders/${order.id}`)}
                      >
                        Chi tiết
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      <CreateReturnModal
        open={returnModal.open}
        onOpenChange={(open) => setReturnModal({ ...returnModal, open })}
        orderId={returnModal.orderId || 0}
        orderItemId={returnModal.orderItemId || 0}
        productId={returnModal.productId || 0}
        variantId={returnModal.variantId}
        productName={returnModal.productName}
        productImage={returnModal.productImage}
        quantity={returnModal.quantity}
        price={returnModal.price}
        onSuccess={() => {
          fetchOrders()
          if (userId) {
            fetchPendingReturns(userId)
          }
        }}
      />

      {userId && (
        <ReturnStatusModal
          open={returnStatusModal.open}
          onOpenChange={(open) => setReturnStatusModal(prev => ({ ...prev, open }))}
          orderItemId={returnStatusModal.orderItemId}
          userId={userId}
        />
      )}

      <ReviewModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ ...reviewModal, open: false })}
        productId={reviewModal.productId || 0}
        productName={reviewModal.productName}
        orderId={reviewModal.orderId || 0}
        reviewId={reviewModal.reviewId}
        initialRating={reviewModal.initialRating}
        initialComment={reviewModal.initialComment}
        onReviewSubmitted={() => {
          fetchOrders()
          if (userId) {
            fetchUserReviews(userId)
          }
        }}
      />
    </main>
  )
}