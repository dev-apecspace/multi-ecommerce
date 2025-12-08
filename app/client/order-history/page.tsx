"use client"

import { useState, useEffect } from "react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface Order {
  id: number
  orderNumber: string
  status: string
  total: number
  shippingCost: number
  date: string
  Vendor: { id: number; name: string }
  OrderItem: Array<{
    id: number
    quantity: number
    price: number
    vendorId: number
    variantId: number | null
    Product: { id: number; name: string }
    ProductVariant?: { id: number; name: string } | null
  }>
}

export default function OrderHistoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [userId, setUserId] = useState<number | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)
  
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
    }
  }, [userId])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/client/orders?userId=${userId}`)
      const result = await response.json()
      setOrders(result.data || [])
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể tải lịch sử đơn hàng', variant: 'destructive' })
    } finally {
      setLoading(false)
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

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Chờ tiếp nhận", color: "bg-gray-100 text-gray-800" },
    processing: { label: "Đã duyệt", color: "bg-blue-100 text-blue-800" },
    shipped: { label: "Đang giao", color: "bg-yellow-100 text-yellow-800" },
    delivered: { label: "Hoàn thành", color: "bg-green-100 text-green-800" },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" }
  }

  if (loading) {
    return (
      <main className="container-viewport py-8">
        <p className="text-center">Đang tải lịch sử đơn hàng...</p>
      </main>
    )
  }

  const allOrders = orders
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const processingOrders = orders.filter(o => o.status === 'processing')
  const shippedOrders = orders.filter(o => o.status === 'shipped')
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
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
          <TabsTrigger value="delivered">Hoàn thành ({deliveredOrders.length})</TabsTrigger>
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
            allOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-lg">{order.orderNumber}</p>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${statusConfig[order.status]?.color || statusConfig.pending.color}`}>
                          {statusConfig[order.status]?.label || order.status}
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
                    {order.OrderItem.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-sm">
                            {item.Product.name}
                            {item.ProductVariant && ` - ${item.ProductVariant.name}`}
                          </p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                      </div>
                    ))}
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
            ))
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
            pendingOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-lg">{order.orderNumber}</p>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${statusConfig[order.status]?.color}`}>
                          {statusConfig[order.status]?.label}
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
                    {order.OrderItem.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-sm">
                            {item.Product.name}
                            {item.ProductVariant && ` - ${item.ProductVariant.name}`}
                          </p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                      </div>
                    ))}
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
            ))
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
            processingOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-lg">{order.orderNumber}</p>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${statusConfig[order.status]?.color}`}>
                          {statusConfig[order.status]?.label}
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
                    {order.OrderItem.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-sm">
                            {item.Product.name}
                            {item.ProductVariant && ` - ${item.ProductVariant.name}`}
                          </p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                      </div>
                    ))}
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
            ))
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
            shippedOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-lg">{order.orderNumber}</p>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${statusConfig[order.status]?.color}`}>
                          {statusConfig[order.status]?.label}
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
                    {order.OrderItem.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-sm">
                            {item.Product.name}
                            {item.ProductVariant && ` - ${item.ProductVariant.name}`}
                          </p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                      </div>
                    ))}
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
            ))
          )}
        </TabsContent>

        <TabsContent value="delivered" className="space-y-4 mt-6">
          {deliveredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Không có đơn hàng hoàn thành
              </CardContent>
            </Card>
          ) : (
            deliveredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-lg">{order.orderNumber}</p>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${statusConfig[order.status]?.color}`}>
                          {statusConfig[order.status]?.label}
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
                    {order.OrderItem.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-sm">
                            {item.Product.name}
                            {item.ProductVariant && ` - ${item.ProductVariant.name}`}
                          </p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                      </div>
                    ))}
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
            ))
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
            cancelledOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-lg">{order.orderNumber}</p>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${statusConfig[order.status]?.color}`}>
                          {statusConfig[order.status]?.label}
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
                    {order.OrderItem.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-sm">
                            {item.Product.name}
                            {item.ProductVariant && ` - ${item.ProductVariant.name}`}
                          </p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                      </div>
                    ))}
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
            ))
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}