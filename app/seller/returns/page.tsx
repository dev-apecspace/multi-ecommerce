"use client"

import { useState, useEffect } from "react"
import { ChevronRight, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useLoading } from "@/hooks/use-loading"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/pagination"
import { useRealtimeReturn } from "@/hooks/use-realtime-return"

interface ReturnRequest {
  id: number
  orderId: number
  orderItemId: number
  userId: number
  productId: number
  variantId: number | null
  reason: string
  description: string
  returnType: string
  exchangeVariantId: number | null
  images: string[]
  refundAmount: number
  quantity: number
  status: string
  sellerNotes: string
  requestedAt: string
  approvedAt: string | null
  shippedAt: string | null
  completedAt: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  Order: { id: number; orderNumber: string; status: string; paymentMethod?: string | null; paymentStatus?: string | null }
  Product?: { id: number; name?: string | null; ProductImage?: Array<{ imageUrl: string; type: string; isMain: boolean; order: number }> } | null
  ProductImage?: Array<{ imageUrl: string; type: string; isMain: boolean; order: number }> | null
  ProductVariant: { id: number; name: string; image?: string | null } | null
  User: { id: number; email: string }
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
  refund_confirmed: { label: "Đã hoàn tiền", color: "bg-teal-100 text-teal-800", icon: CheckCircle },
  completed: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  rejected: { label: "Từ chối", color: "bg-red-100 text-red-800", icon: XCircle },
  cancelled: { label: "Đã hủy", color: "bg-gray-100 text-gray-800", icon: XCircle },
  shipped: { label: "Đang vận chuyển", color: "bg-purple-100 text-purple-800", icon: CheckCircle },
  received: { label: "Đã nhận hàng", color: "bg-orange-100 text-orange-800", icon: CheckCircle },
  restocked: { label: "Đã nhập kho", color: "bg-green-100 text-green-800", icon: CheckCircle },
}

export default function SellerReturnsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { setIsLoading } = useLoading()
  const [vendorId, setVendorId] = useState<number | null>(null)
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  const pagination = usePagination({ initialPage: 1, initialLimit: 20 })

  useEffect(() => {
    if (user?.vendorId) {
      setVendorId(typeof user.vendorId === 'string' ? parseInt(user.vendorId) : user.vendorId)
    }
  }, [user])

  useEffect(() => {
    if (vendorId) {
      fetchReturns()
    }
  }, [vendorId, pagination.page, pagination.limit, activeTab])

  useRealtimeReturn({ vendorId, onUpdate: () => { if (vendorId) fetchReturns() } })

  const fetchReturns = async () => {
    try {
      setIsLoading(true)
      setLoading(true)
      const url = new URL('/api/seller/returns', typeof window !== 'undefined' ? window.location.origin : '')
      url.searchParams.append('vendorId', vendorId!.toString())
      url.searchParams.append('limit', pagination.limit.toString())
      url.searchParams.append('offset', pagination.offset.toString())
      
      if (activeTab !== 'all') {
        url.searchParams.append('status', activeTab)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error("Failed to fetch returns")
      }
      const result = await response.json()
      setReturns(result.data || [])
      pagination.setTotal(result.pagination?.total || 0)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách trả hàng",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    pagination.setPage(1)
  }

  if (loading) {
    return (
      <main className="container-viewport py-8">
        <p className="text-center">Đang tải danh sách trả hàng...</p>
      </main>
    )
  }

  return (
    <main className="container-viewport py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản lý trả hàng</h1>
        <p className="text-muted-foreground">Xử lý các yêu cầu trả hàng từ khách hàng</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="pending">Chờ xử lý</TabsTrigger>
          <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
          <TabsTrigger value="shipped">Đang vận chuyển</TabsTrigger>
          <TabsTrigger value="received">Đã nhận</TabsTrigger>
          <TabsTrigger value="restocked">Đã nhập kho</TabsTrigger>
          <TabsTrigger value="refund_confirmed">Đã hoàn tiền</TabsTrigger>
          <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
          <TabsTrigger value="rejected">Từ chối</TabsTrigger>
          <TabsTrigger value="cancelled">Đã hủy</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          <Card>
            <CardContent className="p-0">
              {returns.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  Không có yêu cầu trả hàng
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-gray-50">
                          <th className="text-left py-3 px-4">Mã đơn gốc</th>
                          <th className="text-left py-3 px-4">Loại</th>
                          <th className="text-left py-3 px-4">Lý do</th>
                          <th className="text-left py-3 px-4">Số tiền</th>
                          <th className="text-left py-3 px-4">Trạng thái</th>
                          <th className="text-left py-3 px-4">Ngày</th>
                          <th className="text-left py-3 px-4">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returns.map((ret) => {
                          const StatusIcon = STATUS_CONFIG[ret.status]?.icon || Clock

                          return (
                            <tr key={ret.id} className="border-b border-border hover:bg-gray-50">
                              <td className="py-3 px-4 font-semibold">#{ret.orderId}</td>
                              <td className="py-3 px-4">
                                <span className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-800">
                                  {ret.returnType === "return" ? "Trả hàng" : "Đổi hàng"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs">
                                {RETURN_REASONS[ret.reason] || ret.reason}
                              </td>
                              <td className="py-3 px-4 font-semibold text-orange-600">
                                {ret.refundAmount.toLocaleString("vi-VN")}₫
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`text-xs px-2 py-1 rounded font-semibold flex items-center gap-1 w-fit ${
                                    STATUS_CONFIG[ret.status]?.color
                                  }`}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {STATUS_CONFIG[ret.status]?.label}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs">
                                {new Date(ret.requestedAt).toLocaleDateString("vi-VN")}
                              </td>
                              <td className="py-3 px-4">
                                <Button variant="outline" size="xs" onClick={() => router.push(`/seller/returns/${ret.id}`)}>
                                  Xem <ChevronRight className="h-3 w-3 ml-0.5" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 border-t px-4 pt-4">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={pagination.goToPage}
                      limit={pagination.limit}
                      onLimitChange={pagination.setPageLimit}
                      total={pagination.total}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </main>
  )
}
