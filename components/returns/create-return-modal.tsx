"use client"

import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface CreateReturnModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: number
  orderItemId: number
  productId: number
  variantId: number | null
  productName: string
  productImage?: string
  quantity: number
  price: number
  onSuccess: () => void
}

const RETURN_REASONS = [
  { value: "defective", label: "Sản phẩm lỗi/hỏng" },
  { value: "wrong_item", label: "Nhận sai sản phẩm" },
  { value: "not_as_described", label: "Không như mô tả" },
  { value: "changed_mind", label: "Đổi ý" },
  { value: "damaged", label: "Hàng bị hư hại" },
  { value: "missing_items", label: "Thiếu vật phẩm" },
  { value: "size_issue", label: "Vấn đề kích thước/khoán" },
  { value: "other", label: "Khác" },
]

const RETURN_TYPES = [
  { value: "return", label: "Trả hàng hoàn tiền" },
 
]

export function CreateReturnModal({
  open,
  onOpenChange,
  orderId,
  orderItemId,
  productId,
  variantId,
  productName,
  productImage,
  quantity,
  price,
  onSuccess,
}: CreateReturnModalProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [returnType, setReturnType] = useState<"return" | "exchange">("return")
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [returnQuantity, setReturnQuantity] = useState(1)
  const [images, setImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const maxSize = 5 * 1024 * 1024 // 5MB

    for (const file of files) {
      if (file.size > maxSize) {
        toast({
          title: "Lỗi",
          description: "Kích thước ảnh không được vượt quá 5MB",
          variant: "destructive",
        })
        continue
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setImages((prev) => [...prev, base64])
      }
      reader.readAsDataURL(file)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    console.log('[RETURN MODAL] handleSubmit called')
    
    if (!reason) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn lý do trả hàng",
        variant: "destructive",
      })
      return
    }

    if (returnQuantity < 1 || returnQuantity > quantity) {
      toast({
        title: "Lỗi",
        description: `Số lượng trả hàng phải từ 1 đến ${quantity}`,
        variant: "destructive",
      })
      return
    }

    if (!user?.id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để tạo yêu cầu trả hàng",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      console.log('[RETURN MODAL] Sending return request:', {
        userId: user.id,
        orderId,
        orderItemId,
        reason,
        returnType,
        quantity: returnQuantity,
        imagesCount: images.length
      })

      const response = await fetch("/api/client/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: typeof user.id === 'string' ? parseInt(user.id) : user.id,
          orderId,
          orderItemId,
          productId,
          variantId,
          reason,
          description,
          returnType,
          quantity: returnQuantity,
          images: images.length > 0 ? images : [],
        }),
      })

      console.log('[RETURN MODAL] API Response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('[RETURN MODAL] API Error:', error)
        throw new Error(error.error || "Không thể tạo yêu cầu trả hàng")
      }

      const data = await response.json()
      console.log('[RETURN MODAL] Return created successfully:', data)

      toast({
        title: "Thành công",
        description: "Yêu cầu trả hàng đã được tạo. Chúng tôi sẽ xử lý sớm.",
      })

      onOpenChange(false)
      onSuccess()
      // Reset form
      setReason("")
      setDescription("")
      setReturnQuantity(1)
      setImages([])
    } catch (error) {
      console.error('[RETURN MODAL] Error:', error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Lỗi không xác định",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Yêu cầu trả hàng</DialogTitle>
          <DialogDescription>
            Cung cấp thông tin chi tiết về lý do trả hàng
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <div className="flex gap-3">
              {productImage && (
                <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{productName}</p>
                <p className="text-sm text-muted-foreground">
                  {price.toLocaleString("vi-VN")}₫ × {quantity} = {(price * quantity).toLocaleString("vi-VN")}₫
                </p>
              </div>
            </div>
          </div>

          {/* Return Type */}
          {/* <div>
            <label className="text-sm font-semibold mb-2 block">Loại yêu cầu</label>
            <div className="grid grid-cols-2 gap-2">
              {RETURN_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setReturnType(type.value as "return" | "exchange")}
                  className={`p-3 text-sm font-medium rounded-lg border transition ${
                    returnType === type.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div> */}

          {/* Return Reason */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Lý do trả hàng *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="">-- Chọn lý do --</option>
              {RETURN_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Return Quantity */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Số lượng trả hàng (tối đa: {quantity})
            </label>
            <input
              type="number"
              min="1"
              max={quantity}
              value={returnQuantity}
              onChange={(e) => setReturnQuantity(Math.max(1, Math.min(quantity, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Mô tả chi tiết</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giải thích chi tiết vấn đề của bạn..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Ảnh chứng minh (tối đa 5MB mỗi ảnh)
            </label>
            <div className="space-y-2">
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={image}
                        alt={`Return proof ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:border-gray-400 transition"
              >
                <Upload className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nhấp để tải ảnh hoặc kéo thả
                </p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !reason}
            >
              {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
