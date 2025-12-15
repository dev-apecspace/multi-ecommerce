"use client"

import { useState, useEffect } from "react"
import { ChevronRight, CheckCircle, XCircle, Clock, Package } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ReturnRequest {
  id: number
  orderId: number
  orderItemId: number
  productId: number
  variantId: number | null
  reason: string
  description: string
  returnType: string
  images: string[]
  refundAmount: number
  quantity: number
  status: string
  sellerNotes: string
  requestedAt: string
  approvedAt: string | null
  completedAt: string | null
  trackingNumber: string | null
  Order: { id: number; orderNumber: string; status: string }
  Product?: { id: number; name?: string | null; ProductImage?: { imageUrl: string }[] | null } | null
  ProductVariant: { id: number; name: string; image?: string | null } | null
  Vendor?: { id: number; name: string } | null
}

const RETURN_REASONS: Record<string, string> = {
  defective: "Sản phẩm lỗi/hỏng",
  wrong_item: "Nhận sai sản phẩm",
  not_as_described: "Không như mô tả",
  changed_mind: "Đổi ý",
  damaged: "Hàng bị hư hại",
  missing_items: "Thiếu vật phẩm",
  size_issue: "Vấn đề kích thước/khoán",
  other: "Khác",
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Đã duyệt", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  rejected: { label: "Từ chối", color: "bg-red-100 text-red-800", icon: XCircle },
  shipped: { label: "Đã gửi", color: "bg-purple-100 text-purple-800", icon: Package },
  completed: { label: "Hoàn thành", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Đã hủy", color: "bg-gray-100 text-gray-800", icon: XCircle },
}

export default function ClientReturnsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [userId, setUserId] = useState<number | null>(null)
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)

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
      fetchReturns()
    }
  }, [userId])

  const fetchReturns = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/client/returns?userId=${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch returns")
      }
      const result = await response.json()
      setReturns(result.data || [])
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách trả hàng",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="container-viewport py-8">
        <p className="text-center">Đang tải danh sách trả hàng...</p>
      </main>
    )
  }

  const pendingReturns = returns.filter((r) => r.status === "pending")
  const approvedReturns = returns.filter((r) => r.status === "approved")
  const shippedReturns = returns.filter((r) => r.status === "shipped")
  const completedReturns = returns.filter((r) => r.status === "completed")
  const rejectedReturns = returns.filter((r) => r.status === "rejected")

  const allReturns = [
    ...pendingReturns,
    ...approvedReturns,
    ...shippedReturns,
    ...completedReturns,
    ...rejectedReturns,
  ]

  return (
    <main className="container-viewport py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Yêu cầu trả hàng</h1>
        <p className="text-muted-foreground">Quản lý các yêu cầu trả hàng / đổi hàng của bạn</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tất cả ({allReturns.length})</TabsTrigger>
          <TabsTrigger value="pending">Chờ xử lý ({pendingReturns.length})</TabsTrigger>
          <TabsTrigger value="approved">Đã duyệt ({approvedReturns.length})</TabsTrigger>
          <TabsTrigger value="shipped">Đã gửi ({shippedReturns.length})</TabsTrigger>
          <TabsTrigger value="completed">Hoàn thành ({completedReturns.length})</TabsTrigger>
          <TabsTrigger value="rejected">Từ chối ({rejectedReturns.length})</TabsTrigger>
        </TabsList>

        {["all", "pending", "approved", "shipped", "completed", "rejected"].map((tabValue) => {
          const tabReturns =
            tabValue === "all"
              ? allReturns
              : returns.filter((r) => r.status === tabValue)

          return (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4 mt-6">
              {tabReturns.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    Không có yêu cầu trả hàng
                  </CardContent>
                </Card>
              ) : (
                tabReturns.map((ret) => {
                  const StatusIcon = STATUS_CONFIG[ret.status]?.icon || Clock
                  const productImages = ret.Product?.ProductImage
                  const variantImage = ret.ProductVariant?.image || null
                  const displayImage = productImages?.[0]?.imageUrl || variantImage || "/placeholder.svg"
                  const productName = ret.Product?.name
                    ? ret.ProductVariant
                      ? `${ret.Product.name} - ${ret.ProductVariant.name}`
                      : ret.Product.name
                    : ret.ProductVariant?.name || "Sản phẩm"

                  return (
                    <Card key={ret.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-semibold text-lg">Đơn #{ret.orderId}</p>
                              <span
                                className={`text-xs px-2 py-1 rounded font-semibold flex items-center gap-1 ${
                                  STATUS_CONFIG[ret.status]?.color
                                }`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {STATUS_CONFIG[ret.status]?.label}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(ret.requestedAt).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">
                              {ret.refundAmount.toLocaleString("vi-VN")}₫
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ret.returnType === "return" ? "Trả hàng" : "Đổi hàng"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded mb-4">
                          <div className="flex gap-3">
                            <div className="relative w-12 h-12 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                              <Image
                                src={displayImage}
                                alt={productName}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">{productName}</p>
                              <p className="text-xs text-muted-foreground">
                                x{ret.quantity} - Lý do: {RETURN_REASONS[ret.reason] || ret.reason}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4 pb-4 border-b">
                          <p className="text-xs text-muted-foreground mb-1">Cửa hàng</p>
                          <p className="text-sm font-semibold">
                            {ret.Vendor?.name || "Đang tải..."}
                          </p>
                        </div>

                        {ret.description && (
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-1">Mô tả</p>
                            <p className="text-sm">{ret.description}</p>
                          </div>
                        )}

                        {ret.images && ret.images.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-2">Hình ảnh</p>
                            <div className="flex gap-2 flex-wrap">
                              {ret.images.map((img, idx) => (
                                <div key={idx} className="relative w-16 h-16 bg-gray-200 rounded overflow-hidden">
                                  <Image
                                    src={img}
                                    alt={`Image ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {ret.sellerNotes && (
                          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                              Ghi chú từ cửa hàng
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">{ret.sellerNotes}</p>
                          </div>
                        )}

                        {ret.trackingNumber && (
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-1">Mã vận chuyển</p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-mono font-semibold">{ret.trackingNumber}</p>
                              {ret.trackingUrl && (
                                <a
                                  href={ret.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  Xem chi tiết
                                  <ChevronRight className="h-4 w-4 inline-block" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                          {ret.approvedAt && (
                            <p>Đã duyệt: {new Date(ret.approvedAt).toLocaleDateString("vi-VN")}</p>
                          )}
                          {ret.completedAt && (
                            <p>Hoàn thành: {new Date(ret.completedAt).toLocaleDateString("vi-VN")}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </main>
  )
}
