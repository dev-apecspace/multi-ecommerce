"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Clock, AlertCircle, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface ReturnRecord {
  id: number
  orderItemId: number
  status: string
  returnType: string
  reason: string
  quantity: number
  refundAmount: number
  trackingNumber?: string
  requestedAt: string
  approvedAt?: string
  completedAt?: string
  sellerNotes?: string
  Product?: { name: string }
  ProductVariant?: { name: string }
  Order?: { paymentMethod?: string | null }
}

interface ReturnStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderItemId: number
  userId: number
  onConfirmExchange?: () => void
}

const RETURN_REASON_LABELS: Record<string, string> = {
  defective: "Sản phẩm lỗi/hỏng",
  wrong_item: "Nhận sai sản phẩm",
  not_as_described: "Không như mô tả",
  changed_mind: "Đổi ý",
  damaged: "Hàng bị hư hại",
  missing_items: "Thiếu vật phẩm",
  size_issue: "Vấn đề kích thước/khoán",
  other: "Khác",
}

const RETURN_TYPE_LABELS: Record<string, string> = {
  return: "Trả hàng hoàn tiền",
  exchange: "Đổi sản phẩm",
}

const COD_STEP_DEFS = [
  { key: "pending", label: "Yêu cầu đã gửi", icon: Clock, color: "bg-blue-100 text-blue-800" },
  { key: "completed", label: "Hoàn thành", icon: CheckCircle, color: "bg-green-100 text-green-800" },
] as const

const NON_COD_STEP_DEFS = [
  { key: "pending", label: "Yêu cầu đã gửi", icon: Clock, color: "bg-blue-100 text-blue-800" },
  { key: "approved", label: "Đã duyệt", icon: CheckCircle, color: "bg-blue-100 text-blue-800" },
  { key: "refund_confirmed", label: "Đã hoàn tiền", icon: CheckCircle, color: "bg-teal-100 text-teal-800" },
  { key: "completed", label: "Đã trả hàng", icon: CheckCircle, color: "bg-green-100 text-green-800" },
] as const

type StepKey = (typeof NON_COD_STEP_DEFS)[number]["key"]

export function ReturnStatusModal({
  open,
  onOpenChange,
  orderItemId,
  userId,
  onConfirmExchange,
}: ReturnStatusModalProps) {
  const [returnData, setReturnData] = useState<ReturnRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (open && orderItemId && userId) {
      fetchReturnStatus()
    }
  }, [open, orderItemId, userId])

  const fetchReturnStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/client/returns?userId=${userId}&limit=100`
      )
      if (!response.ok) {
        return
      }
      const result = await response.json()
      const returns = Array.isArray(result.data) ? result.data : []
      const currentReturn = returns.find(
        (r: ReturnRecord) => r.orderItemId === orderItemId
      )
      setReturnData(currentReturn || null)
    } catch (error) {
      console.error("Error fetching return status:", error)
      setReturnData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmExchange = async () => {
    if (!returnData) return
    try {
      setConfirming(true)
      const response = await fetch(`/api/client/returns`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnId: returnData.id,
          action: "confirm_exchange",
        }),
      })

      if (!response.ok) {
        throw new Error("Không thể xác nhận")
      }

      onOpenChange(false)
      onConfirmExchange?.()
    } catch (error) {
      console.error("Error confirming exchange:", error)
    } finally {
      setConfirming(false)
    }
  }


  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      shipped: "Đang vận chuyển",
      received: "Đã nhận hàng",
      restocked: "Đã nhập kho",
      refund_confirmed: "Đã hoàn tiền",
      completed: "Hoàn thành",
      rejected: "Bị từ chối",
      cancelled: "Đã hủy",
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      shipped: "bg-yellow-100 text-yellow-800",
      completed: "bg-emerald-100 text-emerald-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (!returnData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Trạng thái yêu cầu trả hàng</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải thông tin...
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy yêu cầu trả hàng
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  const paymentMethod = returnData.Order?.paymentMethod || "cod"
  // Treat COD same as other payment methods (require refund step)
  const requiresRefundStep = true 
  const stepDefinitions = requiresRefundStep ? NON_COD_STEP_DEFS : COD_STEP_DEFS
  const statusFlow = stepDefinitions.map((step) => step.key)
  const normalizedStep = (() => {
    if (statusFlow.includes(returnData.status as StepKey)) {
      return returnData.status as StepKey
    }
    
    // Map intermediate statuses to 'completed' step
    if (["shipped", "received", "restocked"].includes(returnData.status)) {
      return "completed" as StepKey
    }

    if (!requiresRefundStep && ["approved", "refund_confirmed"].includes(returnData.status)) {
      return "completed"
    }
    return "pending"
  })()
  let currentStepIndex = statusFlow.indexOf(normalizedStep)
  if (currentStepIndex === -1) currentStepIndex = 0
  const steps = stepDefinitions.map((step, index) => ({
    ...step,
    completed: currentStepIndex >= index && currentStepIndex !== -1,
    isCurrent: currentStepIndex === index,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Trạng thái yêu cầu trả hàng</DialogTitle>
              <DialogDescription>
                Theo dõi tiến trình xử lý yêu cầu của bạn
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Progress */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index === currentStepIndex
              const isCompleted = step.completed

              return (
                <div key={step.key}>
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-green-100 text-green-800"
                            : isActive
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`w-1 h-8 mt-2 ${
                            isCompleted ? "bg-green-200" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p
                        className={`font-semibold ${
                          isCompleted || isActive
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isActive && (
                        <p className="text-sm text-blue-600 mt-1">
                          Hiện tại ở bước này
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Return Details */}
          <Card className="bg-gray-50 dark:bg-gray-900 border-0">
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Loại yêu cầu
                  </p>
                  <p className="font-medium">
                    {RETURN_TYPE_LABELS[returnData.returnType] || returnData.returnType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Lý do</p>
                  <p className="font-medium">
                    {RETURN_REASON_LABELS[returnData.reason] || returnData.reason}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Số lượng
                  </p>
                  <p className="font-medium">{returnData.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Số tiền hoàn lại
                  </p>
                  <p className="font-medium text-orange-600">
                    {returnData.refundAmount.toLocaleString("vi-VN")}₫
                  </p>
                </div>
              </div>

              {returnData.trackingNumber && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Mã vận đơn
                  </p>
                  <p className="font-mono font-semibold">
                    {returnData.trackingNumber}
                  </p>
                </div>
              )}

              {returnData.sellerNotes && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Ghi chú từ người bán
                  </p>
                  <p className="text-sm">{returnData.sellerNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <div className="text-xs text-muted-foreground space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
            <div>
              <span className="font-semibold">Ngày gửi yêu cầu:</span>{" "}
              {new Date(returnData.requestedAt).toLocaleDateString("vi-VN")}
            </div>
            {returnData.approvedAt && (
              <div>
                <span className="font-semibold">Ngày duyệt:</span>{" "}
                {new Date(returnData.approvedAt).toLocaleDateString("vi-VN")}
              </div>
            )}
            {returnData.completedAt && (
              <div>
                <span className="font-semibold">Ngày hoàn thành:</span>{" "}
                {new Date(returnData.completedAt).toLocaleDateString("vi-VN")}
              </div>
            )}
          </div>

          {["rejected", "cancelled"].includes(returnData.status) && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-800 dark:text-red-400">
                  {returnData.status === "rejected"
                    ? "Yêu cầu bị từ chối"
                    : "Yêu cầu đã bị hủy"}
                </p>
                {returnData.sellerNotes && (
                  <p className="text-red-700 dark:text-red-300 mt-1">
                    {returnData.sellerNotes}
                  </p>
                )}
              </div>
            </div>
          )}

          {returnData.status === "shipped" && returnData.returnType === "exchange" && (
            <div className="space-y-2">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-800 dark:text-green-400">
                  ✓ Sản phẩm đổi đã được gửi đến bạn. Vui lòng xác nhận đã nhận hàng để hoàn tất yêu cầu.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleConfirmExchange}
                disabled={confirming}
              >
                {confirming ? "Đang xác nhận..." : "Xác nhận đã nhận hàng đổi"}
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
