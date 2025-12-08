"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Order {
  id: number
  orderNumber: string
  status: string
  total: number
  date: string
  User: { id: number; name: string; email: string }
  Vendor: { id: number; name: string }
  OrderItem: Array<{ 
    id: number
    quantity: number
    price: number
    variantId: number | null
    Product: { id: number; name: string }
    ProductVariant: { id: number; name: string; image: string } | null
  }>
}

export default function AdminOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("")

  useEffect(() => {
    fetchOrders()
  }, [filterStatus])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/admin/orders', window.location.origin)
      if (filterStatus) url.searchParams.append('status', filterStatus)
      const response = await fetch(url)
      const result = await response.json()
      setOrders(result.data || [])
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể tải đơn hàng', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Chờ xử lý", color: "bg-gray-100 text-gray-600" },
    processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-600" },
    shipped: { label: "Đang giao", color: "bg-yellow-100 text-yellow-600" },
    delivered: { label: "Đã giao", color: "bg-green-100 text-green-600" },
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

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Quản lý đơn hàng</h1>

      <div className="grid grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Tất cả</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Chờ xử lý</p>
              <p className="text-3xl font-bold text-gray-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Đang xử lý</p>
              <p className="text-3xl font-bold text-blue-600">{stats.processing}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Đang giao</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.shipped}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Đã giao</p>
              <p className="text-3xl font-bold text-green-600">{stats.delivered}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Đã hủy</p>
              <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="text-base">Lọc theo trạng thái:</Label>
            <Select value={filterStatus || "all"} onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="shipped">Đang giao</SelectItem>
                <SelectItem value="delivered">Đã giao</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Không có đơn hàng nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Mã đơn</th>
                    <th className="text-left py-3 px-4">Khách hàng</th>
                    <th className="text-left py-3 px-4">Shop</th>
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
                          <p className="text-xs text-muted-foreground">{order.User.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{order.Vendor.name}</td>
                      <td className="py-3 px-4 font-semibold">{order.total.toLocaleString("vi-VN")}₫</td>
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
                            setDialogOpen(true)
                          }}
                        >
                          Xem
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Mã đơn</p>
                  <p className="font-semibold">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày</p>
                  <p className="font-semibold">{new Date(selectedOrder.date).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Khách hàng</p>
                  <p className="font-semibold">{selectedOrder.User.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Shop</p>
                  <p className="font-semibold">{selectedOrder.Vendor.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trạng thái</p>
                  <Badge className={statusConfig[selectedOrder.status]?.color || statusConfig.pending.color}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Tổng tiền</p>
                  <p className="font-semibold">{selectedOrder.total.toLocaleString('vi-VN')}₫</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-3">Sản phẩm</p>
                {selectedOrder.OrderItem.map((item, idx) => (
                  <div key={idx} className="flex gap-4 py-3 border-b last:border-b-0">
                    {item.ProductVariant?.image && (
                      <img
                        src={item.ProductVariant.image}
                        alt={item.Product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.Product.name}</p>
                      {item.ProductVariant && (
                        <p className="text-sm text-muted-foreground">({item.ProductVariant.name})</p>
                      )}
                      <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.price.toLocaleString('vi-VN')}₫</p>
                      <p className="text-sm text-muted-foreground">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
