"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, ShoppingBag, X } from "lucide-react"
import Image from "next/image"

interface OrderItem {
  id: number
  quantity: number
  price: number
  variantId: number | null
  Product: { id: number; name: string }
  ProductVariant: { id: number; name: string; image: string } | null
}

interface Order {
  id: number
  orderNumber: string
  status: string
  total: number
  shippingCost: number
  date: string
  paymentMethod: string
  shippingAddress: string
  estimatedDelivery: string
  User: { id: number; name: string; email: string; phone: string }
  OrderItem: OrderItem[]
}

function formatShippingAddress(address: string): string {
  try {
    const parsed = typeof address === 'string' ? JSON.parse(address) : address
    const parts = [
      parsed.street,
      parsed.ward,
      parsed.district,
      parsed.city
    ].filter(Boolean)
    return parts.join(', ')
  } catch {
    return address
  }
}

export default function SellerOrdersPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [trackingNumber, setTrackingNumber] = useState<string>("")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("all")

  const vendorId = user?.vendorId

  useEffect(() => {
    if (vendorId) {
      fetchOrders()
    }
  }, [vendorId])

  const fetchOrders = async () => {
    if (!vendorId) return
    try {
      setLoading(true)
      const url = new URL(`/api/seller/orders`, typeof window !== 'undefined' ? window.location.origin : '')
      url.searchParams.append('vendorId', vendorId.toString())
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const result = await response.json()
      setAllOrders(result.data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast({ title: 'Lỗi', description: 'Không thể tải đơn hàng', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const orders = activeTab === "all" 
    ? allOrders 
    : allOrders.filter(o => o.status === activeTab)

  const handleApproveOrder = async () => {
    if (!selectedOrder || !vendorId) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/seller/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status: 'processing',
          vendorId
        })
      })

      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đơn hàng đã được duyệt' })
        setDetailsOpen(false)
        setSelectedOrder(null)
        await fetchOrders()
      } else {
        toast({ title: 'Lỗi', description: 'Không thể duyệt đơn hàng', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể duyệt đơn hàng', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const handleRejectOrder = async () => {
    if (!selectedOrder || !vendorId) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/seller/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status: 'cancelled',
          vendorId
        })
      })

      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đơn hàng đã bị từ chối' })
        setDetailsOpen(false)
        setSelectedOrder(null)
        await fetchOrders()
      } else {
        toast({ title: 'Lỗi', description: 'Không thể từ chối đơn hàng', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể từ chối đơn hàng', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateStatus = async (statusToUpdate?: string) => {
    const statusValue = statusToUpdate || newStatus
    if (!selectedOrder || !statusValue || !vendorId) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/seller/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status: statusValue,
          shippingTrackingNumber: trackingNumber,
          vendorId
        })
      })

      if (response.ok) {
        toast({ title: 'Thành công', description: 'Cập nhật trạng thái đơn hàng' })
        setDetailsOpen(false)
        setNewStatus("")
        setTrackingNumber("")
        setSelectedOrder(null)
        await fetchOrders()
      } else {
        toast({ title: 'Lỗi', description: 'Không thể cập nhật', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Chờ tiếp nhận", color: "bg-gray-100 text-gray-600" },
    processing: { label: "Đã duyệt", color: "bg-blue-100 text-blue-600" },
    shipped: { label: "Đang giao", color: "bg-yellow-100 text-yellow-600" },
    delivered: { label: "Hoàn thành", color: "bg-green-100 text-green-600" },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-600" }
  }

  if (loading) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-8">Quản lý đơn hàng</h1>
        <p className="text-center">Đang tải...</p>
      </main>
    )
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Quản lý đơn hàng</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="pending">Chờ tiếp nhận</TabsTrigger>
          <TabsTrigger value="processing">Đã duyệt</TabsTrigger>
          <TabsTrigger value="shipped">Đang giao</TabsTrigger>
          <TabsTrigger value="delivered">Hoàn thành</TabsTrigger>
          <TabsTrigger value="cancelled">Đã hủy</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Chờ tiếp nhận</p>
              <p className="text-3xl font-bold text-gray-600">{allOrders.filter(o => o.status === 'pending').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Đã duyệt</p>
              <p className="text-3xl font-bold text-blue-600">{allOrders.filter(o => o.status === 'processing').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Đang giao</p>
              <p className="text-3xl font-bold text-yellow-600">{allOrders.filter(o => o.status === 'shipped').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Hoàn thành</p>
              <p className="text-3xl font-bold text-green-600">{allOrders.filter(o => o.status === 'delivered').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Chưa có đơn hàng nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Mã đơn</th>
                    <th className="text-left py-3 px-4">Khách hàng</th>
                    <th className="text-left py-3 px-4">Tổng tiền</th>
                    <th className="text-left py-3 px-4">Trạng thái</th>
                    <th className="text-left py-3 px-4">Ngày</th>
                    <th className="text-left py-3 px-4">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-surface dark:hover:bg-slate-900">
                      <td className="py-3 px-4 font-semibold">{order.orderNumber}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{order.User.name}</p>
                          <p className="text-xs text-muted-foreground">{order.User.phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{order.total.toLocaleString("vi-VN")}₫</td>
                      <td className="py-3 px-4">
                        <Badge className={statusConfig[order.status]?.color || statusConfig.pending.color}>
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{new Date(order.date).toLocaleDateString("vi-VN")}</td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order)
                            setNewStatus(order.status)
                            setDetailsOpen(true)
                          }}
                        >
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="border-b pb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Mã đơn</p>
                    <p className="font-semibold text-lg">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trạng thái</p>
                    <Badge className={statusConfig[selectedOrder.status]?.color || statusConfig.pending.color}>
                      {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-3">Thông tin khách hàng</p>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Tên:</span> {selectedOrder.User.name}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedOrder.User.email}</p>
                  <p><span className="text-muted-foreground">Số điện thoại:</span> {selectedOrder.User.phone}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Sản phẩm ({selectedOrder.OrderItem.length})
                </p>
                <div className="space-y-3">
                  {selectedOrder.OrderItem.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-3 border-b last:border-0">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {item.ProductVariant?.image ? (
                          <Image
                            src={item.ProductVariant.image}
                            alt={item.Product.name}
                            width={80}
                            height={80}
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.Product.name}</p>
                        {item.ProductVariant && (
                          <p className="text-xs text-muted-foreground">{item.ProductVariant.name}</p>
                        )}
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                          <span className="text-sm font-semibold">{(item.price * item.quantity).toLocaleString("vi-VN")}₫</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tổng sản phẩm:</span>
                  <span>{(selectedOrder.total - selectedOrder.shippingCost).toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí vận chuyển:</span>
                  <span>{selectedOrder.shippingCost.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-base">
                  <span>Tổng cộng:</span>
                  <span className="text-green-600">{selectedOrder.total.toLocaleString("vi-VN")}₫</span>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <p className="text-sm font-semibold mb-2">Địa chỉ giao hàng</p>
                <p className="text-sm text-muted-foreground">{formatShippingAddress(selectedOrder.shippingAddress)}</p>
              </div>

              {/* Status Update Actions */}
              {selectedOrder.status === 'pending' && (
                <div className="border-t pt-4 space-y-2">
                  <Button 
                    onClick={handleApproveOrder}
                    disabled={updating}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {updating ? 'Đang xử lý...' : '✓ Duyệt đơn'}
                  </Button>
                  <Button 
                    onClick={handleRejectOrder}
                    disabled={updating}
                    variant="destructive"
                    className="w-full"
                  >
                    {updating ? 'Đang xử lý...' : '✕ Hủy đơn'}
                  </Button>
                </div>
              )}

              {selectedOrder.status === 'processing' && (
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <Label className="text-sm">Mã vận chuyển</Label>
                    <Input
                      placeholder="Nhập mã vận chuyển"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => handleUpdateStatus('shipped')}
                    disabled={updating}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {updating ? 'Đang xử lý...' : '→ Đẩy vận chuyển'}
                  </Button>
                </div>
              )}

              {selectedOrder.status === 'shipped' && (
                <div className="border-t pt-4">
                  <Button 
                    onClick={() => handleUpdateStatus('delivered')}
                    disabled={updating}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {updating ? 'Đang xử lý...' : '✓ Hoàn thành'}
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDetailsOpen(false)
                setNewStatus("")
                setTrackingNumber("")
              }}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
