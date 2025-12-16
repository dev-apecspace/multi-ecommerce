"use client"

import { useState, useEffect } from "react"
import { Check, X, Calendar, DollarSign, Percent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"

type VoucherStatus = 'pending' | 'approved' | 'rejected'
type DiscountType = 'percentage' | 'fixed'
type VoucherType = 'private' | 'public'

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
  status: VoucherStatus
  rejectionReason?: string
  createdAt: string
  Vendor?: {
    id: number
    name: string
    userId: number
  }
}

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

export default function AdminVouchersPage() {
  const { toast } = useToast()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const pagination = usePagination({ initialPage: 1, initialLimit: 10 })

  useEffect(() => {
    fetchVouchers()
  }, [activeTab, pagination.page, pagination.limit])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/admin/vouchers', window.location.origin)
      url.searchParams.append('status', activeTab)
      url.searchParams.append('page', String(pagination.page))
      url.searchParams.append('limit', String(pagination.limit))
      
      const response = await fetch(url.toString())
      if (!response.ok) throw new Error('Failed to fetch vouchers')
      const result = await response.json()
      setVouchers(result.data || [])
      pagination.setTotal(result.pagination?.total || 0)
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

  const fetchStats = async () => {
    try {
      const statuses: VoucherStatus[] = ['pending', 'approved', 'rejected']
      const newStats = { pending: 0, approved: 0, rejected: 0, total: 0 }

      for (const status of statuses) {
        const response = await fetch(`/api/admin/vouchers?status=${status}&limit=1`)
        const { pagination } = await response.json()
        const count = pagination?.total || 0
        newStats[status] = count
        newStats.total += count
      }

      setStats(newStats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleApprove = async (voucher: Voucher) => {
    try {
      const response = await fetch(`/api/admin/vouchers?id=${voucher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
        }),
      })

      if (!response.ok) throw new Error('Failed to approve voucher')

      toast({
        title: 'Thành công',
        description: `Đã phê duyệt voucher: ${voucher.code}`,
      })
      setVouchers(prev => prev.filter(v => v.id !== voucher.id))
      fetchStats()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể phê duyệt voucher',
        variant: 'destructive',
      })
    }
  }

  const handleRejectClick = (voucherId: number) => {
    setSelectedVoucherId(voucherId)
    setRejectionReason('')
    setShowRejectDialog(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedVoucherId) return

    try {
      setRejecting(true)
      const response = await fetch(`/api/admin/vouchers?id=${selectedVoucherId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: rejectionReason || 'Không tuân thủ chính sách',
        }),
      })

      if (!response.ok) throw new Error('Failed to reject voucher')

      const voucher = vouchers.find(v => v.id === selectedVoucherId)
      toast({
        title: 'Thành công',
        description: `Đã từ chối voucher: ${voucher?.code}`,
      })
      setVouchers(prev => prev.filter(v => v.id !== selectedVoucherId))
      fetchStats()
      setShowRejectDialog(false)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể từ chối voucher',
        variant: 'destructive',
      })
    } finally {
      setRejecting(false)
    }
  }

  const getStatusBadge = (status: VoucherStatus) => {
    const style = statusStyle[status]
    return <span className={`${style} px-2 py-1 rounded text-xs font-medium`}>{statusLabel[status]}</span>
  }

  return (
    <main className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản lý Voucher</h1>
        <p className="text-muted-foreground">Phê duyệt voucher do nhà bán hàng đăng tải</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng Voucher</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chờ Duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã Duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bị Từ Chối</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Chờ Duyệt ({stats.pending})</TabsTrigger>
          <TabsTrigger value="approved">Đã Duyệt ({stats.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Bị Từ Chối ({stats.rejected})</TabsTrigger>
        </TabsList>

        {(['pending', 'approved', 'rejected'] as const).map(status => (
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
                              <p className="text-sm text-gray-600">{voucher.Vendor?.name || 'Unknown Shop'}</p>
                              {voucher.description && (
                                <p className="text-xs text-gray-500">{voucher.description}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Giảm:</span>
                              <span className="font-semibold text-lg">
                                {voucher.discountValue}
                                {voucher.discountType === 'percentage' ? '%' : '₫'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className={`text-xs px-2 py-1 rounded font-medium ${typeStyle[voucher.type]}`}>
                                {typeLabel[voucher.type]}
                              </span>
                              {getStatusBadge(voucher.status)}
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>
                                {new Date(voucher.startDate).toLocaleDateString('vi-VN')}
                                <br />
                                đến {new Date(voucher.endDate).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              Dùng: {voucher.usageCount}
                              {voucher.totalUsageLimit && `/${voucher.totalUsageLimit}`}
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Tối thiểu: </span>
                              <span className="font-semibold">{voucher.minOrderValue}₫</span>
                            </div>
                            {voucher.maxDiscount && (
                              <div>
                                <span className="text-gray-600">Giảm tối đa: </span>
                                <span className="font-semibold">{voucher.maxDiscount}₫</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {status === 'pending' && (
                          <div className="col-span-2 flex gap-2 justify-end">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(voucher)}
                            >
                              <Check size={16} />
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectClick(voucher.id)}
                            >
                              <X size={16} />
                              Từ chối
                            </Button>
                          </div>
                        )}

                        {status === 'rejected' && voucher.rejectionReason && (
                          <div className="col-span-12 mt-4 p-3 bg-red-50 border border-red-200 rounded">
                            <p className="font-semibold text-red-800 text-sm mb-1">Lý do từ chối:</p>
                            <p className="text-red-700 text-sm">{voucher.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {vouchers.length > 0 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={pagination.goToPage}
                      limit={pagination.limit}
                      onLimitChange={pagination.setPageLimit}
                      total={pagination.total}
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {showRejectDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Từ Chối Voucher</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Lý Do Từ Chối</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(false)}
                  disabled={rejecting}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRejectConfirm}
                  disabled={rejecting}
                >
                  {rejecting ? 'Đang xử lý...' : 'Xác Nhận'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
