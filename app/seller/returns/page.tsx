"use client"

import { useState, useEffect } from "react"
import { ChevronRight, CheckCircle, XCircle, Clock } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

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
  Product?: { id: number; name?: string | null; ProductImage?: { imageUrl: string }[] | null } | null
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
  const [vendorId, setVendorId] = useState<number | null>(null)
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingReturnId, setProcessingReturnId] = useState<number | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null)
  const [approveData, setApproveData] = useState({
    sellerNotes: "",
  })
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [trackingReturnId, setTrackingReturnId] = useState<number | null>(null)
  const [trackingForm, setTrackingForm] = useState({ trackingNumber: "", trackingUrl: "" })

  useEffect(() => {
    if (user?.vendorId) {
      setVendorId(typeof user.vendorId === 'string' ? parseInt(user.vendorId) : user.vendorId)
    }
  }, [user])

  useEffect(() => {
    if (vendorId) {
      fetchReturns()
    }
  }, [vendorId])

  const fetchReturns = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/seller/returns?vendorId=${vendorId}`)
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

  const sendReturnAction = async (
    payload: Record<string, any>,
    successMessage: string,
    errorMessage: string
  ) => {
    try {
      setProcessingReturnId(payload.returnId)
      const response = await fetch(`/api/seller/returns`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error || errorMessage)
      }

      toast({
        title: "Thành công",
        description: successMessage,
      })
      fetchReturns()
      return true
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setProcessingReturnId(null)
    }
  }

  const handleApproveWithModal = (returnId: number) => {
    setSelectedReturnId(returnId)
    setShowApproveModal(true)
    setApproveData({ sellerNotes: "" })
  }

  const handleApprove = async () => {
    if (!selectedReturnId) return
    await sendReturnAction(
      {
        returnId: selectedReturnId,
        action: "approve",
        sellerNotes: approveData.sellerNotes,
      },
      "Yêu cầu trả hàng đã được duyệt",
      "Không thể duyệt yêu cầu trả hàng"
    )
    setShowApproveModal(false)
  }

  const openTrackingModal = (returnRequest: ReturnRequest) => {
    setTrackingReturnId(returnRequest.id)
    setTrackingForm({
      trackingNumber: returnRequest.trackingNumber || "",
      trackingUrl: returnRequest.trackingUrl || "",
    })
    setShowTrackingModal(true)
  }

  const handleTrackingSubmit = async () => {
    if (!trackingReturnId) return

    if (!trackingForm.trackingNumber.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập mã vận đơn",
        variant: "destructive",
      })
      return
    }

    const success = await handleMarkShipped(trackingReturnId, {
      trackingNumber: trackingForm.trackingNumber.trim(),
      trackingUrl: trackingForm.trackingUrl.trim() || undefined,
    })

    if (success) {
      setShowTrackingModal(false)
      setTrackingReturnId(null)
      setTrackingForm({ trackingNumber: "", trackingUrl: "" })
    }
  }

  const handleReject = async (returnId: number) => {
    await sendReturnAction(
      { returnId, action: "reject" },
      "Yêu cầu trả hàng đã được từ chối",
      "Không thể từ chối yêu cầu trả hàng"
    )
  }

  const handleConfirmRefund = async (returnId: number) => {
    await sendReturnAction(
      { returnId, action: "confirm_refund" },
      "Đã xác nhận hoàn tiền cho khách",
      "Không thể xác nhận hoàn tiền"
    )
  }

  const handleMarkShipped = async (returnId: number, extraPayload: Record<string, any> = {}) => {
    return sendReturnAction(
      { returnId, action: "mark_shipped", ...extraPayload },
      "Đã cập nhật trạng thái vận chuyển",
      "Không thể cập nhật trạng thái vận chuyển"
    )
  }

  const handleMarkReceived = async (returnId: number) => {
    await sendReturnAction(
      { returnId, action: "mark_received" },
      "Đã xác nhận đã nhận hàng",
      "Không thể xác nhận trạng thái nhận hàng"
    )
  }

  const handleMarkRestocked = async (returnId: number) => {
    await sendReturnAction(
      { returnId, action: "mark_restocked" },
      "Đã nhập hàng vào kho",
      "Không thể cập nhật trạng thái nhập kho"
    )
  }

  const handleMarkCompleted = async (returnId: number) => {
    await sendReturnAction(
      { returnId, action: "mark_completed" },
      "Đã hoàn tất yêu cầu trả hàng",
      "Không thể hoàn thành yêu cầu trả hàng"
    )
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
  const receivedReturns = returns.filter((r) => r.status === "received")
  const restockedReturns = returns.filter((r) => r.status === "restocked")
  const refundConfirmedReturns = returns.filter((r) => r.status === "refund_confirmed")
  const completedReturns = returns.filter((r) => r.status === "completed")
  const rejectedReturns = returns.filter((r) => r.status === "rejected")
  const cancelledReturns = returns.filter((r) => r.status === "cancelled")

  const allReturns = returns

  return (
    <main className="container-viewport py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản lý trả hàng</h1>
        <p className="text-muted-foreground">Xử lý các yêu cầu trả hàng từ khách hàng</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tất cả ({allReturns.length})</TabsTrigger>
          <TabsTrigger value="pending">Chờ xử lý ({pendingReturns.length})</TabsTrigger>
          <TabsTrigger value="approved">Đã duyệt ({approvedReturns.length})</TabsTrigger>
          <TabsTrigger value="shipped">Đang vận chuyển ({shippedReturns.length})</TabsTrigger>
          <TabsTrigger value="received">Đã nhận ({receivedReturns.length})</TabsTrigger>
          <TabsTrigger value="restocked">Đã nhập kho ({restockedReturns.length})</TabsTrigger>
          <TabsTrigger value="refund_confirmed">Đã hoàn tiền ({refundConfirmedReturns.length})</TabsTrigger>
          <TabsTrigger value="completed">Hoàn thành ({completedReturns.length})</TabsTrigger>
          <TabsTrigger value="rejected">Từ chối ({rejectedReturns.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Đã hủy ({cancelledReturns.length})</TabsTrigger>
        </TabsList>

        {/* All Tabs */}
        {["all", "pending", "approved", "shipped", "received", "restocked", "refund_confirmed", "completed", "rejected", "cancelled"].map((tabValue) => {
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
                  const paymentMethod = (ret.Order?.paymentMethod || "cod").toLowerCase()
                  const requiresRefund = ret.returnType === "return"
                  const refundCompleted =
                    ret.status === "refund_confirmed" || ret.Order?.paymentStatus === "refunded"
                  const awaitingRefund = requiresRefund && !refundCompleted

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

                        {/* Product Info */}
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

                        {/* Customer Info */}
                        <div className="mb-4 pb-4 border-b">
                          <p className="text-xs text-muted-foreground mb-1">Khách hàng</p>
                          <p className="text-sm font-semibold">
                            {ret.User?.email || "Không xác định"}
                          </p>
                        </div>

                        {/* Description & Images */}
                        {ret.description && (
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-1">Mô tả</p>
                            <p className="text-sm">{ret.description}</p>
                          </div>
                        )}

                        {ret.images && ret.images.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-2">Ảnh chứng minh</p>
                            <div className="flex gap-2 overflow-x-auto">
                              {ret.images.map((image, idx) => (
                                <div
                                  key={idx}
                                  className="relative w-20 h-20 flex-shrink-0 bg-gray-200 rounded overflow-hidden"
                                >
                                  <Image
                                    src={image}
                                    alt={`Proof ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 justify-end pt-4 border-t flex-wrap">
                          {ret.status === "pending" && (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={processingReturnId === ret.id}
                                onClick={() => handleReject(ret.id)}
                              >
                                {processingReturnId === ret.id ? "Đang xử lý..." : "Từ chối"}
                              </Button>
                              <Button
                                size="sm"
                                disabled={processingReturnId === ret.id}
                                onClick={() => handleApproveWithModal(ret.id)}
                              >
                                {processingReturnId === ret.id ? "Đang xử lý..." : "Duyệt yêu cầu"}
                              </Button>
                            </>
                          )}

                          {ret.status === "approved" && (
                            awaitingRefund ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-teal-700 border-teal-200"
                                disabled={processingReturnId === ret.id}
                                onClick={() => handleConfirmRefund(ret.id)}
                              >
                                {processingReturnId === ret.id ? "Đang xác nhận..." : "Xác nhận hoàn tiền"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={processingReturnId === ret.id}
                                onClick={() => openTrackingModal(ret)}
                              >
                                {processingReturnId === ret.id ? "Đang xử lý..." : "Đánh dấu đang vận chuyển"}
                              </Button>
                            )
                          )}

                          {ret.status === "shipped" && (
                            awaitingRefund ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-teal-700 border-teal-200"
                                disabled={processingReturnId === ret.id}
                                onClick={() => handleConfirmRefund(ret.id)}
                              >
                                {processingReturnId === ret.id ? "Đang xác nhận..." : "Xác nhận hoàn tiền"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={processingReturnId === ret.id}
                                onClick={() => handleMarkReceived(ret.id)}
                              >
                                {processingReturnId === ret.id ? "Đang xử lý..." : "Xác nhận đã nhận hàng"}
                              </Button>
                            )
                          )}

                          {ret.status === "received" && (
                            awaitingRefund ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-teal-700 border-teal-200"
                                disabled={processingReturnId === ret.id}
                                onClick={() => handleConfirmRefund(ret.id)}
                              >
                                {processingReturnId === ret.id ? "Đang xác nhận..." : "Xác nhận hoàn tiền"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={processingReturnId === ret.id}
                                onClick={() => handleMarkRestocked(ret.id)}
                              >
                                {processingReturnId === ret.id ? "Đang xử lý..." : "Đánh dấu đã nhập kho"}
                              </Button>
                            )
                          )}

                          {ret.status === "restocked" && (
                            <>
                              {awaitingRefund ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-teal-700 border-teal-200"
                                  disabled={processingReturnId === ret.id}
                                  onClick={() => handleConfirmRefund(ret.id)}
                                >
                                  {processingReturnId === ret.id ? "Đang xác nhận..." : "Xác nhận hoàn tiền"}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={processingReturnId === ret.id}
                                  onClick={() => handleMarkCompleted(ret.id)}
                                >
                                  {processingReturnId === ret.id ? "Đang xử lý..." : "Hoàn thành"}
                                </Button>
                              )}
                            </>
                          )}

                          {ret.status === "refund_confirmed" && (
                            <Button
                              size="sm"
                              disabled={processingReturnId === ret.id}
                              onClick={() => openTrackingModal(ret)}
                            >
                              {processingReturnId === ret.id ? "Đang xử lý..." : "Đánh dấu đang vận chuyển"}
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/seller/returns/${ret.id}`)
                            }
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
          )
        })}
      </Tabs>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Duyệt yêu cầu trả hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Thông tin này sẽ được gửi đến khách hàng làm hướng dẫn trả hàng
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Hướng dẫn cho khách hàng (tùy chọn)
                </label>
                <textarea
                  value={approveData.sellerNotes}
                  onChange={(e) =>
                    setApproveData({
                      sellerNotes: e.target.value,
                    })
                  }
                  placeholder="Ví dụ: Vui lòng gửi hàng trở lại trong 7 ngày..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowApproveModal(false)}
                  disabled={processingReturnId !== null}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processingReturnId !== null}
                >
                  {processingReturnId !== null ? "Đang xử lý..." : "Duyệt"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog
        open={showTrackingModal}
        onOpenChange={(open) => {
          setShowTrackingModal(open)
          if (!open) {
            setTrackingReturnId(null)
            setTrackingForm({ trackingNumber: "", trackingUrl: "" })
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin vận chuyển</DialogTitle>
            <DialogDescription>
              Nhập mã vận đơn và link tra cứu trước khi đánh dấu đang vận chuyển
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tracking-number">Mã vận đơn *</Label>
              <Input
                id="tracking-number"
                value={trackingForm.trackingNumber}
                onChange={(e) =>
                  setTrackingForm((prev) => ({ ...prev, trackingNumber: e.target.value }))
                }
                placeholder="Ví dụ: VN123456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking-url">Link tra cứu (tùy chọn)</Label>
              <Input
                id="tracking-url"
                value={trackingForm.trackingUrl}
                onChange={(e) =>
                  setTrackingForm((prev) => ({ ...prev, trackingUrl: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTrackingModal(false)}
              disabled={processingReturnId === trackingReturnId}
            >
              Hủy
            </Button>
            <Button onClick={handleTrackingSubmit} disabled={processingReturnId === trackingReturnId || !trackingReturnId}>
              {processingReturnId === trackingReturnId ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
