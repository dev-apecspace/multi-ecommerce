"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Truck, Package } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface OrderItem {
  id: number
  quantity: number
  price: number
  vendorId: number
  variantId: number | null
  Product: { id: number; name: string }
  ProductVariant?: { id: number; name: string; image?: string } | null
}

interface Order {
  id: number
  orderNumber: string
  status: string
  total: number
  date: string
  paymentMethod: string
  shippingAddress: string
  Vendor: { id: number; name: string }
  OrderItem: OrderItem[]
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
    }
  }, [userId, orderId])

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

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "Chờ xử lý", color: "bg-gray-100 text-gray-800", icon: <Package className="h-4 w-4" /> },
    processing: { label: "Đã duyệt", color: "bg-blue-100 text-blue-800", icon: <Package className="h-4 w-4" /> },
    shipped: { label: "Đang giao", color: "bg-yellow-100 text-yellow-800", icon: <Truck className="h-4 w-4" /> },
    delivered: { label: "Đã giao", color: "bg-green-100 text-green-800", icon: <Truck className="h-4 w-4" /> },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800", icon: <Package className="h-4 w-4" /> }
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
                <Badge className={statusConfig[order.status]?.color || statusConfig.pending.color}>
                  {statusConfig[order.status]?.label || order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Ngày đặt hàng: {new Date(order.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>Phương thức thanh toán: {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}</p>
              </div>
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
                  return (
                    <div key={item.id} className="flex gap-4 border-b pb-4 last:border-b-0">
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
                              {item.ProductVariant && ` - ${item.ProductVariant.name}`}
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
    </main>
  )
}
