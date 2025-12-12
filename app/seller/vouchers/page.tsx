"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Edit2, Copy, Calendar, DollarSign, Percent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

type VoucherStatus = 'pending' | 'approved' | 'rejected'
type VoucherType = 'private' | 'public'
type DiscountType = 'percentage' | 'fixed'

const statusLabel: Record<VoucherStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
}

const statusStyle: Record<VoucherStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const typeLabel: Record<VoucherType, string> = {
  private: 'Riêng tư',
  public: 'Công khai',
}

const typeStyle: Record<VoucherType, string> = {
  private: 'bg-purple-100 text-purple-800',
  public: 'bg-blue-100 text-blue-800',
}

interface Voucher {
  id: number
  code: string
  description?: string
  type: VoucherType
  discountType: DiscountType
  discountValue: number
  maxDiscount?: number
  minOrderValue: number
  maxUsagePerUser: number
  totalUsageLimit?: number
  usageCount: number
  startDate: string
  endDate: string
  active: boolean
  status: VoucherStatus
  rejectionReason?: string
  createdAt: string
}

export default function SellerVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('approved')
  const [deleting, setDeleting] = useState<number | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user?.id) {
      fetchVouchers()
    }
  }, [user, activeTab])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/seller/vouchers?status=${activeTab}`)
      if (!response.ok) throw new Error('Failed to fetch vouchers')
      const { data } = await response.json()
      setVouchers(data || [])
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách voucher',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn chắc chắn muốn xóa voucher này?')) return

    try {
      setDeleting(id)
      const response = await fetch(`/api/seller/vouchers?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete voucher')

      toast({
        title: 'Thành công',
        description: 'Voucher đã được xóa',
      })
      fetchVouchers()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa voucher',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: 'Thành công',
      description: 'Mã voucher đã được sao chép',
    })
  }

  const isExpired = (endDate: string) => new Date(endDate) < new Date()
  const isActive = (startDate: string, endDate: string) => {
    const now = new Date()
    return new Date(startDate) <= now && now < new Date(endDate)
  }

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => !isExpired(v.endDate) && v.active).length,
    usage: vouchers.reduce((sum, v) => sum + v.usageCount, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Voucher</h1>
          <p className="text-gray-600">Tạo và quản lý voucher giảm giá cho khách hàng</p>
        </div>
        <Link href="/seller/vouchers/create">
          <Button className="gap-2">
            <Plus size={20} />
            Tạo Voucher
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tổng Voucher</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Voucher Hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lượt Sử dụng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.usage}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="approved">Đã duyệt ({vouchers.filter(v => v.status === 'approved').length})</TabsTrigger>
          <TabsTrigger value="pending">Chờ duyệt ({vouchers.filter(v => v.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="rejected">Bị từ chối ({vouchers.filter(v => v.status === 'rejected').length})</TabsTrigger>
        </TabsList>

        {['approved', 'pending', 'rejected'].map(status => (
          <TabsContent key={status} value={status}>
            {loading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : vouchers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">Chưa có voucher</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {vouchers.map(voucher => (
                  <Card key={voucher.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-3 rounded">
                              {voucher.discountType === 'percentage' ? (
                                <Percent size={24} className="text-blue-600" />
                              ) : (
                                <DollarSign size={24} className="text-green-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{voucher.code}</p>
                              <p className="text-sm text-gray-600">{voucher.description}</p>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Giảm:</span>
                              <span className="font-semibold">
                                {voucher.discountValue}
                                {voucher.discountType === 'percentage' ? '%' : '₫'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className={`text-xs px-2 py-1 rounded ${typeStyle[voucher.type]}`}>
                                {typeLabel[voucher.type]}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${statusStyle[voucher.status as VoucherStatus]}`}>
                                {statusLabel[voucher.status as VoucherStatus]}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar size={14} />
                              <span>
                                {new Date(voucher.startDate).toLocaleDateString('vi-VN')}
                                <br />
                                đến {new Date(voucher.endDate).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            {isExpired(voucher.endDate) && (
                              <div className="text-xs text-red-600 font-semibold">Hết hạn</div>
                            )}
                            {isActive(voucher.startDate, voucher.endDate) && (
                              <div className="text-xs text-green-600 font-semibold">Đang hoạt động</div>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-gray-600">Sử dụng: </span>
                              <span className="font-semibold">
                                {voucher.usageCount}
                                {voucher.totalUsageLimit && `/${voucher.totalUsageLimit}`}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">Mỗi KH: </span>
                              <span className="font-semibold">{voucher.maxUsagePerUser}</span>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2 flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(voucher.code)}
                            title="Sao chép mã"
                          >
                            <Copy size={16} />
                          </Button>
                          {voucher.status === 'approved' && (
                            <Link href={`/seller/vouchers/${voucher.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit2 size={16} />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(voucher.id)}
                            disabled={deleting === voucher.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>

                      {voucher.status === 'rejected' && voucher.rejectionReason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                          <p className="font-semibold text-red-800">Lý do từ chối:</p>
                          <p className="text-red-700">{voucher.rejectionReason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
