"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ExchangeRequest {
  id: number
  orderId: number
  orderItemId: number
  productId: number
  variantId: number | null
  reason: string
  description: string
  returnType: string
  images: string[]
  quantity: number
  status: string
  sellerNotes: string
  requestedAt: string
  approvedAt: string | null
  completedAt: string | null
  Order: { id: number; orderNumber: string; status: string }
  Product?: { id: number; name?: string | null; ProductImage?: { imageUrl: string }[] | null } | null
  ProductVariant: { id: number; name: string; image?: string | null } | null
  Vendor?: { id: number; name: string } | null
}

const EXCHANGE_REASONS: Record<string, string> = {
  defective: "Sản phẩm lỗi/hỏng",
  wrong_item: "Nhận sai sản phẩm",
  not_as_described: "Không như mô tả",
  size_issue: "Vấn đề kích thước/khoán",
  color_issue: "Vấn đề màu sắc",
  other: "Khác",
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Chờ liên hệ", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Đã duyệt", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  rejected: { label: "Từ chối", color: "bg-red-100 text-red-800", icon: XCircle },
  completed: { label: "Hoàn thành", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Đã hủy", color: "bg-gray-100 text-gray-800", icon: XCircle },
}

export default function ClientExchangesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [userId, setUserId] = useState<number | null>(null)
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      setUserId(Number(user.id))
    } else {
      const storedUserId = localStorage.getItem('userId')
      if (storedUserId) {
        setUserId(parseInt(storedUserId))
      }
    }
  }, [user])

  useEffect(() => {
    if (userId) {
      fetchExchanges()
    }
  }, [userId])

  const fetchExchanges = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/client/returns?userId=${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch exchanges")
      }
      const result = await response.json()
      const exchangesOnly = (result.data || []).filter((item: ExchangeRequest) => item.returnType === "exchange")
      setExchanges(exchangesOnly)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đổi hàng",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleContactVendor = (vendorId: number, vendorName: string) => {
    router.push(`/client/chat?vendorId=${vendorId}&vendorName=${vendorName}`)
  }

  if (loading) {
    return (
      <main className="container-viewport py-8">
        <p className="text-center">Đang tải danh sách đổi hàng...</p>
      </main>
    )
  }

  const pendingExchanges = exchanges.filter((e) => e.status === "pending")
  const approvedExchanges = exchanges.filter((e) => e.status === "approved")
  const completedExchanges = exchanges.filter((e) => e.status === "completed")
  const cancelledExchanges = exchanges.filter((e) => e.status === "cancelled")

  const allExchanges = [
    ...pendingExchanges,
    ...approvedExchanges,
    ...completedExchanges,
    ...cancelledExchanges,
  ]

  return (
    <main className="container-viewport py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Yêu cầu đổi hàng</h1>
        <p className="text-muted-foreground">Liên hệ trực tiếp với cửa hàng để thương lượng chi tiết đổi hàng</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tất cả ({allExchanges.length})</TabsTrigger>
          <TabsTrigger value="pending">Chờ liên hệ ({pendingExchanges.length})</TabsTrigger>
          <TabsTrigger value="approved">Đã duyệt ({approvedExchanges.length})</TabsTrigger>
          <TabsTrigger value="completed">Hoàn thành ({completedExchanges.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Đã hủy ({cancelledExchanges.length})</TabsTrigger>
        </TabsList>

        {["all", "pending", "approved", "completed", "cancelled"].map((tabValue) => {
          const tabExchanges =
            tabValue === "all"
              ? allExchanges
              : exchanges.filter((e) => e.status === tabValue)

          return (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4 mt-6">
              {tabExchanges.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    Không có yêu cầu đổi hàng
                  </CardContent>
                </Card>
              ) : (
                tabExchanges.map((exchange) => {
                  const StatusIcon = STATUS_CONFIG[exchange.status]?.icon || Clock
                  const productImages = exchange.Product?.ProductImage
                  const variantImage = exchange.ProductVariant?.image || null
                  const displayImage = productImages?.[0]?.imageUrl || variantImage || "/placeholder.svg"
                  const productName = exchange.Product?.name
                    ? exchange.ProductVariant
                      ? `${exchange.Product.name} - ${exchange.ProductVariant.name}`
                      : exchange.Product.name
                    : exchange.ProductVariant?.name || "Sản phẩm"

                  return (
                    <Card key={exchange.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-semibold text-lg">Đơn #{exchange.orderId}</p>
                              <span
                                className={`text-xs px-2 py-1 rounded font-semibold flex items-center gap-1 ${
                                  STATUS_CONFIG[exchange.status]?.color
                                }`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {STATUS_CONFIG[exchange.status]?.label}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(exchange.requestedAt).toLocaleDateString("vi-VN")}
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
                                x{exchange.quantity} - Lý do: {EXCHANGE_REASONS[exchange.reason] || exchange.reason}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4 pb-4 border-b">
                          <p className="text-xs text-muted-foreground mb-1">Cửa hàng</p>
                          <p className="text-sm font-semibold">
                            {exchange.Vendor?.name || "Đang tải..."}
                          </p>
                        </div>

                        {exchange.description && (
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-1">Mô tả yêu cầu</p>
                            <p className="text-sm">{exchange.description}</p>
                          </div>
                        )}

                        {exchange.images && exchange.images.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-2">Hình ảnh</p>
                            <div className="flex gap-2 flex-wrap">
                              {exchange.images.map((img, idx) => (
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

                        {exchange.sellerNotes && (
                          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                              Ghi chú từ cửa hàng
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">{exchange.sellerNotes}</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => handleContactVendor(exchange.Vendor?.id || 0, exchange.Vendor?.name || "")}
                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Liên hệ shop
                          </Button>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t mt-4">
                          {exchange.approvedAt && (
                            <p>Đã duyệt: {new Date(exchange.approvedAt).toLocaleDateString("vi-VN")}</p>
                          )}
                          {exchange.completedAt && (
                            <p>Hoàn thành: {new Date(exchange.completedAt).toLocaleDateString("vi-VN")}</p>
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
