"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type DiscountType = 'percentage' | 'fixed'

interface Voucher {
  id: number
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  maxDiscount?: number
  minOrderValue: number
  maxUsagePerUser: number
  totalUsageLimit?: number
  startDate: string
  endDate: string
}

export default function EditVoucherPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const voucherId = params.id as string
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const [formData, setFormData] = useState({
    description: '',
    discountValue: '',
    maxDiscount: '',
    minOrderValue: '0',
    maxUsagePerUser: '1',
    totalUsageLimit: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchVoucher()
  }, [voucherId])

  const fetchVoucher = async () => {
    try {
      setInitialLoading(true)
      const response = await fetch(`/api/seller/vouchers?id=${voucherId}`)
      if (!response.ok) throw new Error('Failed to fetch voucher')
      const { data } = await response.json()
      
      if (data && data.length > 0) {
        const voucher = data[0]
        setFormData({
          description: voucher.description || '',
          discountValue: voucher.discountValue.toString(),
          maxDiscount: voucher.maxDiscount?.toString() || '',
          minOrderValue: voucher.minOrderValue.toString(),
          maxUsagePerUser: voucher.maxUsagePerUser.toString(),
          totalUsageLimit: voucher.totalUsageLimit?.toString() || '',
          startDate: new Date(voucher.startDate).toISOString().slice(0, 16),
          endDate: new Date(voucher.endDate).toISOString().slice(0, 16),
        })
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải voucher',
        variant: 'destructive',
      })
    } finally {
      setInitialLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.discountValue || !formData.startDate || !formData.endDate) {
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
      const response = await fetch(`/api/seller/vouchers?id=${voucherId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description || null,
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
        throw new Error(error.error || 'Failed to update voucher')
      }

      toast({
        title: 'Thành công',
        description: 'Voucher đã được cập nhật',
      })
      router.push('/seller/vouchers')
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể cập nhật voucher',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return <div className="text-center py-8">Đang tải...</div>
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
          <h1 className="text-3xl font-bold">Chỉnh Sửa Voucher</h1>
          <p className="text-gray-600">Cập nhật thông tin voucher</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông Tin Cơ Bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <label className="block text-sm font-medium mb-2">Mức Giảm Giá *</label>
              <Input
                name="discountValue"
                type="number"
                value={formData.discountValue}
                onChange={handleChange}
                placeholder="0"
                min="0"
              />
            </div>
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

      <div className="flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          size="lg"
        >
          {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
        </Button>
        <Link href="/seller/vouchers">
          <Button variant="outline" size="lg">
            Hủy
          </Button>
        </Link>
      </div>
    </div>
  )
}
