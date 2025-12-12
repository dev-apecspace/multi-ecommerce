"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type VoucherType = 'private' | 'public'
type DiscountType = 'percentage' | 'fixed'

export default function CreateVoucherPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'public' as VoucherType,
    discountType: 'percentage' as DiscountType,
    discountValue: '',
    maxDiscount: '',
    minOrderValue: '0',
    maxUsagePerUser: '1',
    totalUsageLimit: '',
    startDate: '',
    endDate: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.discountValue || !formData.startDate || !formData.endDate) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ các trường bắt buộc',
        variant: 'destructive',
      })
      return
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast({
        title: 'Lỗi',
        description: 'Ngày kết thúc phải sau ngày bắt đầu',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/seller/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          description: formData.description || null,
          type: formData.type,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          maxDiscount: formData.maxDiscount ? formData.maxDiscount : null,
          minOrderValue: formData.minOrderValue,
          maxUsagePerUser: formData.maxUsagePerUser,
          totalUsageLimit: formData.totalUsageLimit ? formData.totalUsageLimit : null,
          startDate: formData.startDate,
          endDate: formData.endDate,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create voucher')
      }

      toast({
        title: 'Thành công',
        description: 'Voucher đã được tạo và chờ duyệt từ admin',
      })
      router.push('/seller/vouchers')
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể tạo voucher',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/seller/vouchers">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Tạo Voucher Mới</h1>
          <p className="text-gray-600">Tạo voucher để khuyến khích khách hàng mua hàng</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Cơ Bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Mã Voucher *</label>
                <Input
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="VD: SUMMER2024"
                  className="uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mô Tả</label>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả về voucher"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Loại Voucher *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="public">Công khai</option>
                    <option value="private">Riêng tư</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Loại Giảm Giá *</label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền (₫)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Giảm Giá</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mức Giảm Giá {formData.discountType === 'percentage' ? '(%)' : '(₫)'} *
                  </label>
                  <Input
                    name="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Giảm Giá Tối Đa (₫)</label>
                    <Input
                      name="maxDiscount"
                      type="number"
                      value={formData.maxDiscount}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Giá Trị Đơn Hàng Tối Thiểu (₫)</label>
                <Input
                  name="minOrderValue"
                  type="number"
                  value={formData.minOrderValue}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Sử Dụng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Số Lần Dùng Tối Đa Mỗi Khách Hàng *</label>
                  <Input
                    name="maxUsagePerUser"
                    type="number"
                    value={formData.maxUsagePerUser}
                    onChange={handleChange}
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Giới Hạn Sử Dụng Toàn Bộ</label>
                  <Input
                    name="totalUsageLimit"
                    type="number"
                    value={formData.totalUsageLimit}
                    onChange={handleChange}
                    placeholder="Không giới hạn"
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thời Gian Hiệu Lực</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ngày Bắt Đầu *</label>
                  <Input
                    name="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ngày Kết Thúc *</label>
                  <Input
                    name="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border-2 border-dashed rounded-lg bg-gray-50">
                <div className="text-2xl font-bold text-center text-blue-600 mb-2">
                  {formData.discountValue || '0'}
                  {formData.discountType === 'percentage' ? '%' : '₫'}
                </div>
                <div className="text-center text-sm font-semibold mb-3">
                  {formData.code || 'YOUR_CODE'}
                </div>
                {formData.description && (
                  <div className="text-center text-xs text-gray-600 mb-3">
                    {formData.description}
                  </div>
                )}
                <div className="space-y-2 text-xs text-gray-600">
                  {formData.minOrderValue && (
                    <div>Tối thiểu: {formData.minOrderValue}₫</div>
                  )}
                  {formData.discountType === 'percentage' && formData.maxDiscount && (
                    <div>Giảm tối đa: {formData.maxDiscount}₫</div>
                  )}
                  {formData.startDate && (
                    <div>Bắt đầu: {new Date(formData.startDate).toLocaleDateString('vi-VN')}</div>
                  )}
                  {formData.endDate && (
                    <div>Kết thúc: {new Date(formData.endDate).toLocaleDateString('vi-VN')}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loại:</span>
                  <span className="font-semibold">{formData.type === 'public' ? 'Công khai' : 'Riêng tư'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mỗi KH:</span>
                  <span className="font-semibold">{formData.maxUsagePerUser} lần</span>
                </div>
                {formData.totalUsageLimit && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giới hạn:</span>
                    <span className="font-semibold">{formData.totalUsageLimit} lần</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Đang tạo...' : 'Tạo Voucher'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
