"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Truck, Package, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { CreateReturnModal } from "@/components/returns/create-return-modal"
import { ReturnStatusModal } from "@/components/returns/return-status-modal"

interface OrderItem {
  id: number
  quantity: number
  price: number
  vendorId: number
  variantId: number | null
  variantName?: string | null
  productId: number
  Product: { id: number; name: string; image?: string }
  ProductVariant?: { id: number; name: string; image?: string } | null
}

interface Order {
  id: number
  orderNumber: string
  status: string
  total: number
  date: string
  updatedAt: string
  paymentMethod: string
  shippingAddress: string
  Vendor: { id: number; name: string }
  OrderItem: OrderItem[]
}

interface ReturnModalState {
  open: boolean
  orderId: number | null
  orderItemId: number | null
  productId: number
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

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OrderDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const resolvedParams = use(params)
  const orderId = resolvedParams.id

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [returnStatuses, setReturnStatuses] = useState<Record<number, string>>({})
  const [returnModal, setReturnModal] = useState<ReturnModalState>({
    open: false,
    orderId: null,
    orderItemId: null,
    productId: 0,
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
    if (userId && orderId) {
      fetchOrder()
      fetchOrderReturns(userId, parseInt(orderId))
    }
  }, [userId, orderId])

  const fetchOrderReturns = async (currentUserId: number, currentOrderId: number) => {
    try {
      const response = await fetch(`/api/client/returns?userId=${currentUserId}&orderId=${currentOrderId}&limit=100`)
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

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/client/orders?userId=${userId}&limit=100&offset=0`)
      const result = await response.json()
      const foundOrder = result.data?.find((o: Order) => o.id === parseInt(orderId))
      if (foundOrder) {
        setOrder(foundOrder)
      } else {
        toast({ title: 'Lỗi', description: 'Không tìm thấy đơn hàng', variant: 'destructive' })
        router.push('/client/order-history')
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể tải thông tin đơn hàng', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenReturnModal = (orderId: number, item: OrderItem) => {
    if (returnStatuses[item.id]) {
      toast({ title: 'Thông báo', description: 'Đã gửi yêu cầu đổi/trả cho sản phẩm này' })
      return
    }

    const displayImage = item.ProductVariant?.image || '/placeholder.svg'
    const productName = (item.variantName || item.ProductVariant)
      ? `${item.Product.name} - ${item.variantName || item.ProductVariant?.name}`
      : item.Product.name
    
    setReturnModal({
      open: true,
      orderId,
      orderItemId: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName,
      productImage: displayImage,
      quantity: item.quantity,
      price: item.price
    })
  }

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "Chờ xử lý", color: "bg-gray-100 text-gray-800", icon: <Package className="h-4 w-4" /> },
    processing: { label: "Đã duyệt", color: "bg-blue-100 text-blue-800", icon: <Package className="h-4 w-4" /> },
    shipped: { label: "Đang giao", color: "bg-yellow-100 text-yellow-800", icon: <Truck className="h-4 w-4" /> },
    delivered: { label: "Đã giao", color: "bg-green-100 text-green-800", icon: <Truck className="h-4 w-4" /> },
    completed: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-800", icon: <CheckCircle className="h-4 w-4" /> },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800", icon: <Package className="h-4 w-4" /> },
    return_requested: { label: "Đã gửi yêu cầu đổi/trả hàng", color: "bg-purple-100 text-purple-800", icon: <Package className="h-4 w-4" /> },
    returned: { label: "Đã đổi trả", color: "bg-indigo-100 text-indigo-800", icon: <CheckCircle className="h-4 w-4" /> }
  }

  const handleConfirmReceipt = async () => {
    if (!order) return
    try {
      setConfirming(true)
      const response = await fetch(`/api/client/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          status: 'completed'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Không thể xác nhận nhận hàng')
      }

      toast({
        title: 'Thành công',
        description: 'Bạn đã xác nhận nhận hàng. Cảm ơn bạn!'
      })
      
      await fetchOrder()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể xác nhận nhận hàng',
        variant: 'destructive'
      })
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <main className="container-viewport py-8">
        <p className="text-center">Đang tải thông tin đơn hàng...</p>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="container-viewport py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Không tìm thấy đơn hàng</p>
            <Button onClick={() => router.push('/client/order-history')}>
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const shippingAddressData = (() => {
    try {
      return JSON.parse(order.shippingAddress || '{}')
    } catch {
      return {}
    }
  })()

  const returnStatusValues = Object.values(returnStatuses)
  const hasActiveReturn = returnStatusValues.some((status) => status !== 'completed')
  const hasCompletedReturn = order.status === 'returned' || returnStatusValues.some((status) => status === 'completed')
  const shouldDisableConfirm = returnStatusValues.length > 0
  const statusKey = hasCompletedReturn ? 'returned' : hasActiveReturn ? 'return_requested' : order.status

  return (
    <main className="container-viewport py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <h1 className="text-3xl font-bold mb-2">Chi tiết đơn hàng</h1>
        <p className="text-muted-foreground">Mã đơn: {order.orderNumber}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Trạng thái đơn hàng</CardTitle>
                <Badge className={statusConfig[statusKey]?.color || statusConfig.pending.color}>
                  {statusConfig[statusKey]?.label || statusKey}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Ngày đặt hàng: {new Date(order.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>Phương thức thanh toán: {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}</p>
              </div>
              {order.status === 'delivered' && (
                <>
                  <Button 
                    onClick={handleConfirmReceipt}
                    disabled={confirming || shouldDisableConfirm}
                    className="w-full"
                  >
                    {confirming ? 'Đang xác nhận...' : 'Xác nhận đã nhận hàng'}
                  </Button>
                  {shouldDisableConfirm && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                      <p className="text-sm text-purple-800 dark:text-purple-400 mb-2">
                        {hasActiveReturn
                          ? 'Đơn hàng này đang có yêu cầu đổi/trả, không thể xác nhận hoàn thành.'
                          : 'Đơn hàng này đã được xử lý đổi/trả, không thể xác nhận hoàn thành.'}
                      </p>
                      {Object.entries(returnStatuses).map(([itemId]) => {
                        const item = order.OrderItem.find(i => i.id === parseInt(itemId))
                        if (!item) return null
                        return (
                          <Button
                            key={itemId}
                            variant="outline"
                            size="sm"
                            className="w-full text-purple-600 hover:text-purple-700 border-purple-200 hover:bg-purple-50"
                            onClick={() => setReturnStatusModal({ open: true, orderItemId: parseInt(itemId) })}
                          >
                            Xem trạng thái trả hàng
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Vendor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Nhà bán hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{order.Vendor?.name || 'Đang tải...'}</p>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm trong đơn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.OrderItem.map((item) => {
                  const displayImage = item.ProductVariant?.image || '/placeholder.svg'
                  const itemReturnStatus = returnStatuses[item.id]
                  const itemHasReturnRecord = Boolean(itemReturnStatus)
                  return (
                    <div key={item.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                          <Image
                            src={displayImage}
                            alt={item.Product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between gap-4">
                            <div>
                              <p className="font-medium line-clamp-2">
                                {item.Product.name}
                                {(item.variantName || item.ProductVariant?.name) && ` - ${item.variantName || item.ProductVariant?.name}`}
                              </p>
                              <p className="text-sm text-muted-foreground">Số lượng: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{item.price.toLocaleString('vi-VN')}₫ × {item.quantity}</p>
                              <p className="text-sm font-bold text-orange-600">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {isReturnable(order) && (
                        itemHasReturnRecord ? (
                          <div className="mt-2 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-purple-600 hover:text-purple-700 border-purple-200 hover:bg-purple-50"
                              onClick={() => setReturnStatusModal({ open: true, orderItemId: item.id })}
                            >
                              Xem trạng thái đổi/trả
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                              onClick={() => handleOpenReturnModal(order.id, item)}
                            >
                              Trả hàng hoàn tiền
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Địa chỉ giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p className="font-semibold">{shippingAddressData.fullName}</p>
                <p>{shippingAddressData.phone}</p>
                <p className="text-muted-foreground">
                  {shippingAddressData.street}, {shippingAddressData.ward}
                </p>
                <p className="text-muted-foreground">
                  {shippingAddressData.district}, {shippingAddressData.city}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính:</span>
                <span>{order.OrderItem.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-3">
                <span className="font-semibold">Tổng cộng:</span>
                <span className="font-bold text-orange-600 text-lg">{order.total.toLocaleString('vi-VN')}₫</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              Liên hệ hỗ trợ
            </Button>
            <Button variant="outline" className="w-full">
              In đơn hàng
            </Button>
          </div>
        </div>
      </div>

      <CreateReturnModal
        open={returnModal.open}
        onOpenChange={(open) => setReturnModal(prev => ({ ...prev, open }))}
        orderId={returnModal.orderId!}
        orderItemId={returnModal.orderItemId!}
        productId={returnModal.productId}
        variantId={returnModal.variantId}
        productName={returnModal.productName}
        productImage={returnModal.productImage}
        quantity={returnModal.quantity}
        price={returnModal.price}
        onSuccess={() => {
          toast({
            title: "Thành công",
            description: "Yêu cầu trả hàng đã được gửi",
          })
          if (userId && orderId) {
            fetchOrderReturns(userId, parseInt(orderId))
          }
          fetchOrder()
          setReturnModal(prev => ({ ...prev, open: false }))
        }}
      />

      {userId && (
        <ReturnStatusModal
          open={returnStatusModal.open}
          onOpenChange={(open) => setReturnStatusModal(prev => ({ ...prev, open }))}
          orderItemId={returnStatusModal.orderItemId}
          userId={userId}
          onConfirmExchange={() => {
            if (userId && orderId) {
              fetchOrderReturns(userId, parseInt(orderId))
            }
            fetchOrder()
          }}
        />
      )}
    </main>
  )
}
