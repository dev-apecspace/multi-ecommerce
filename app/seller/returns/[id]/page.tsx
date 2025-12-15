"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface Return {
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
  Product?: { id: number; name?: string | null }
  ProductVariant: { id: number; name: string; image?: string | null } | null
  User: { id: number; email: string }
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
  in_transit: { label: "Đang vận chuyển", color: "bg-orange-50 text-orange-700", icon: CheckCircle },
  received: { label: "Đã nhận hàng", color: "bg-orange-100 text-orange-800", icon: CheckCircle },
  restocked: { label: "Đã nhập kho", color: "bg-green-100 text-green-800", icon: CheckCircle },
}

const REFUND_FLOW = ["pending", "approved", "refund_confirmed", "shipped", "received", "restocked", "completed"] as const
const NO_REFUND_FLOW = ["pending", "approved", "shipped", "received", "restocked", "completed"] as const

type StatusFlowKey = (typeof REFUND_FLOW)[number]
const LEGACY_STATUS_MAP: Partial<Record<string, StatusFlowKey>> = {
  in_transit: "shipped",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ReturnDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const resolvedParams = use(params)
  const returnId = parseInt(resolvedParams.id)

  const [returnData, setReturnData] = useState<Return | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [vendorId, setVendorId] = useState<number | null>(null)
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false)
  const [trackingForm, setTrackingForm] = useState({ trackingNumber: "", trackingUrl: "" })

  useEffect(() => {
    if (user?.vendorId) {
      setVendorId(
        typeof user.vendorId === "string"
          ? parseInt(user.vendorId)
          : user.vendorId
      )
    }
  }, [user])

  useEffect(() => {
    if (vendorId) {
      fetchReturnDetail()
    }
  }, [vendorId, returnId])

  const fetchReturnDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/seller/returns?vendorId=${vendorId}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const result = await response.json()
      const found = result.data?.find((r: Return) => r.id === returnId)
      if (found) {
        setReturnData(found)
      } else {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy yêu cầu trả hàng",
          variant: "destructive",
        })
        router.push("/seller/returns")
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openTrackingDialog = () => {
    if (!returnData) return
    setTrackingForm({
      trackingNumber: returnData.trackingNumber || "",
      trackingUrl: returnData.trackingUrl || "",
    })
    setTrackingDialogOpen(true)
  }

  const handleTrackingSubmit = async () => {
    if (!trackingForm.trackingNumber.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập mã vận đơn",
        variant: "destructive",
      })
      return
    }

    const success = await handleMarkShipped({
      trackingNumber: trackingForm.trackingNumber.trim(),
      trackingUrl: trackingForm.trackingUrl.trim() || undefined,
    })

    if (success) {
      setTrackingDialogOpen(false)
    }
  }

  const applyReturnUpdate = (updates: Partial<Return>, orderUpdates?: Partial<Return["Order"]>) => {
    setReturnData((prev) => {
      if (!prev) return prev
      const nextOrder = orderUpdates && prev.Order ? { ...prev.Order, ...orderUpdates } : prev.Order
      return {
        ...prev,
        ...updates,
        Order: nextOrder,
      }
    })
  }

  const sendAction = async (
    action: string,
    successMessage: string,
    errorMessage: string,
    body: Record<string, any> = {},
    orderUpdates?: Partial<Return["Order"]>
  ) => {
    if (!returnData) return false
    try {
      setProcessing(true)
      const response = await fetch(`/api/seller/returns`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnId: returnData.id,
          action,
          ...body,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error || errorMessage)
      }

      const updatedReturn: Partial<Return> = await response.json()

      toast({
        title: "Thành công",
        description: successMessage,
      })
      applyReturnUpdate(updatedReturn, orderUpdates)
      return true
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error ? error.message : errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setProcessing(false)
    }
  }

  const handleApprove = async () => {
    await sendAction(
      "approve",
      "Yêu cầu trả hàng đã được duyệt",
      "Không thể duyệt yêu cầu",
      {},
      { status: "returned" }
    )
  }

  const handleReject = async () => {
    const success = await sendAction(
      "reject",
      "Yêu cầu trả hàng đã được từ chối",
      "Không thể từ chối yêu cầu"
    )
    if (success) {
      router.push("/seller/returns")
    }
  }

  const handleMarkShipped = async (body: Record<string, any> = {}) => {
    return sendAction(
      "mark_shipped",
      "Đã cập nhật trạng thái vận chuyển",
      "Không thể cập nhật trạng thái vận chuyển",
      body
    )
  }

  const handleMarkReceived = async () => {
    await sendAction(
      "mark_received",
      "Đã xác nhận đã nhận hàng",
      "Không thể xác nhận trạng thái nhận hàng"
    )
  }

  const handleMarkRestocked = async () => {
    await sendAction(
      "mark_restocked",
      "Đã nhập hàng vào kho",
      "Không thể cập nhật trạng thái nhập kho"
    )
  }

  const handleConfirmRefund = async () => {
    await sendAction(
      "confirm_refund",
      "Đã xác nhận hoàn tiền cho khách",
      "Không thể xác nhận hoàn tiền",
      {},
      { paymentStatus: "refunded" }
    )
  }

  const handleMarkCompleted = async () => {
    await sendAction(
      "mark_completed",
      "Yêu cầu trả hàng đã hoàn thành",
      "Không thể hoàn thành yêu cầu"
    )
  }

  if (loading) {
    return (
      <main className="container-viewport py-8">
        <p className="text-center">Đang tải thông tin...</p>
      </main>
    )
  }

  if (!returnData) {
    return (
      <main className="container-viewport py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              Không tìm thấy yêu cầu trả hàng
            </p>
            <Button onClick={() => router.push("/seller/returns")}>
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const displayImage =
    returnData.ProductVariant?.image || "/placeholder.svg"
  const productName = returnData.Product?.name
    ? returnData.ProductVariant
      ? `${returnData.Product.name} - ${returnData.ProductVariant.name}`
      : returnData.Product.name
    : returnData.ProductVariant?.name || "Sản phẩm"

  const paymentMethod = (returnData.Order?.paymentMethod || "cod").toLowerCase()
  const requiresRefundStep = returnData.returnType === "return"
  const refundCompleted =
    returnData.status === "refund_confirmed" ||
    returnData.Order?.paymentStatus === "refunded"
  const flowWithRefund = requiresRefundStep || returnData.status === "refund_confirmed"

  const normalizedStatus = (() => {
    if (REFUND_FLOW.includes(returnData.status as StatusFlowKey)) {
      return returnData.status as StatusFlowKey
    }
    return LEGACY_STATUS_MAP[returnData.status] ?? null
  })()

  const flow: readonly StatusFlowKey[] = flowWithRefund ? REFUND_FLOW : NO_REFUND_FLOW
  const flowStatusKey = (() => {
    if (!normalizedStatus) return null
    if (flow.includes(normalizedStatus)) {
      return normalizedStatus
    }
    if (!flowWithRefund && normalizedStatus === "refund_confirmed") {
      return "restocked"
    }
    return null
  })()

  const currentStepIndex = flowStatusKey ? flow.indexOf(flowStatusKey) : -1
  const nextStepKey = (() => {
    if (currentStepIndex === -1 || currentStepIndex >= flow.length - 1) return null
    const next = flow[currentStepIndex + 1]
    if (next === "refund_confirmed" && refundCompleted) {
      return flow[currentStepIndex + 2] || null
    }
    return next
  })()

  const steps = flow.map((statusKey, index) => ({
    key: statusKey,
    label: STATUS_CONFIG[statusKey]?.label || statusKey,
    completed: (currentStepIndex >= index && currentStepIndex !== -1) || (statusKey === "refund_confirmed" && refundCompleted),
    isCurrent: currentStepIndex === index,
  }))

  const requiresRefundConfirmation =
    requiresRefundStep && !refundCompleted

  const actionButtons = (() => {
    if (!returnData || !flowStatusKey) return []

    switch (flowStatusKey) {
      case "pending":
        return [
          <Button
            key="reject"
            variant="destructive"
            className="w-full"
            disabled={processing}
            onClick={handleReject}
          >
            {processing ? "Đang xử lý..." : "Từ chối"}
          </Button>,
          <Button
            key="approve"
            className="w-full"
            disabled={processing}
            onClick={handleApprove}
          >
            {processing ? "Đang xử lý..." : "Duyệt yêu cầu"}
          </Button>,
        ]

      case "approved":
        if (requiresRefundConfirmation) {
          return [
            <Button
              key="confirm-refund"
              variant="outline"
              className="w-full text-teal-700 border-teal-200"
              disabled={processing}
              onClick={handleConfirmRefund}
            >
              {processing ? "Đang xử lý..." : "Xác nhận đã hoàn tiền"}
            </Button>,
          ]
        }
        return [
          <Button
            key="mark-shipped"
            className="w-full"
            disabled={processing}
            onClick={openTrackingDialog}
          >
            {processing ? "Đang xử lý..." : "Đánh dấu đang vận chuyển"}
          </Button>,
        ]

      case "shipped":
        if (requiresRefundConfirmation) {
          return [
            <Button
              key="confirm-refund-after-ship"
              variant="outline"
              className="w-full text-teal-700 border-teal-200"
              disabled={processing}
              onClick={handleConfirmRefund}
            >
              {processing ? "Đang xử lý..." : "Xác nhận đã hoàn tiền"}
            </Button>,
          ]
        }
        return [
          <Button
            key="mark-received"
            className="w-full"
            disabled={processing}
            onClick={handleMarkReceived}
          >
            {processing ? "Đang xử lý..." : "Xác nhận đã nhận hàng"}
          </Button>,
        ]

      case "received":
        if (requiresRefundConfirmation) {
          return [
            <Button
              key="confirm-refund-after-receive"
              variant="outline"
              className="w-full text-teal-700 border-teal-200"
              disabled={processing}
              onClick={handleConfirmRefund}
            >
              {processing ? "Đang xử lý..." : "Xác nhận đã hoàn tiền"}
            </Button>,
          ]
        }
        return [
          <Button
            key="mark-restocked"
            className="w-full"
            disabled={processing}
            onClick={handleMarkRestocked}
          >
            {processing ? "Đang xử lý..." : "Đánh dấu đã nhập kho"}
          </Button>,
        ]

      case "restocked":
        if (requiresRefundConfirmation) {
          return [
            <Button
              key="confirm-refund-after-restock"
              variant="outline"
              className="w-full text-teal-700 border-teal-200"
              disabled={processing}
              onClick={handleConfirmRefund}
            >
              {processing ? "Đang xử lý..." : "Xác nhận đã hoàn tiền"}
            </Button>,
          ]
        }
        return [
          <Button
            key="complete-after-restock"
            className="w-full"
            disabled={processing}
            onClick={handleMarkCompleted}
          >
            {processing ? "Đang xử lý..." : "Hoàn thành"}
          </Button>,
        ]

      case "refund_confirmed":
        return [
          <Button
            key="mark-shipped-after-refund"
            className="w-full"
            disabled={processing}
            onClick={openTrackingDialog}
          >
            {processing ? "Đang xử lý..." : "Đánh dấu đang vận chuyển"}
          </Button>,
        ]

      default:
        return []
    }
  })()

  return (
    <main className="container-viewport py-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Chi tiết yêu cầu trả hàng</h1>
          <Badge className={STATUS_CONFIG[returnData.status]?.color}>
            {STATUS_CONFIG[returnData.status]?.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Quy trình xử lý</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <div key={step.key}>
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            step.completed
                              ? "bg-green-100 text-green-800"
                              : step.isCurrent
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {step.completed ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <Clock className="h-5 w-5" />
                          )}
                        </div>
                        {idx < steps.length - 1 && (
                          <div
                            className={`w-1 h-8 mt-2 ${
                              step.completed ? "bg-green-200" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold">{step.label}</p>
                        {step.isCurrent && (
                          <p className="text-sm text-blue-600 mt-1">
                            Hiện tại ở bước này
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">Hành động tiếp theo</p>
                  {nextStepKey && (
                    <span className="text-xs text-muted-foreground">
                      Bước tiếp: {STATUS_CONFIG[nextStepKey]?.label}
                    </span>
                  )}
                </div>
                {actionButtons.length > 0 ? (
                  <div className="flex flex-col gap-2">{actionButtons}</div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Không còn hành động nào cho yêu cầu này.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                  <Image
                    src={displayImage}
                    alt={productName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold mb-2">{productName}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Số lượng: {returnData.quantity}
                  </p>
                  <p className="text-lg font-bold text-orange-600">
                    {returnData.refundAmount.toLocaleString("vi-VN")}₫
                  </p>
                </div>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Loại yêu cầu
                  </p>
                  <p className="text-sm font-medium">
                    Trả hàng hoàn tiền
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Lý do</p>
                  <p className="text-sm font-medium">
                    {RETURN_REASONS[returnData.reason] || returnData.reason}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin khách hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{returnData.User?.email}</p>
            </CardContent>
          </Card>

          {/* Description & Images */}
          {(returnData.description || (returnData.images && returnData.images.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle>Chi tiết yêu cầu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {returnData.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Mô tả chi tiết
                    </p>
                    <p className="text-sm">{returnData.description}</p>
                  </div>
                )}

                {returnData.images && returnData.images.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Ảnh chứng minh
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {returnData.images.map((image, idx) => (
                        <div
                          key={idx}
                          className="relative w-20 h-20 bg-gray-200 rounded overflow-hidden"
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
              </CardContent>
            </Card>
          )}

          {/* Seller Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Ghi chú từ người bán</CardTitle>
            </CardHeader>
            <CardContent>
              {returnData.sellerNotes ? (
                <p className="text-sm">{returnData.sellerNotes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có ghi chú</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dòng thời gian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Ngày gửi yêu cầu
                </p>
                <p className="font-medium">
                  {new Date(returnData.requestedAt).toLocaleDateString(
                    "vi-VN"
                  )}
                </p>
              </div>

              {returnData.approvedAt && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Ngày duyệt
                  </p>
                  <p className="font-medium">
                    {new Date(returnData.approvedAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                </div>
              )}

              {returnData.shippedAt && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Ngày vận chuyển
                  </p>
                  <p className="font-medium">
                    {new Date(returnData.shippedAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                </div>
              )}

              {returnData.completedAt && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Ngày hoàn thành
                  </p>
                  <p className="font-medium">
                    {new Date(returnData.completedAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
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
              onClick={() => setTrackingDialogOpen(false)}
              disabled={processing}
            >
              Hủy
            </Button>
            <Button onClick={handleTrackingSubmit} disabled={processing}>
              {processing ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
