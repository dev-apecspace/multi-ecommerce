"use client"

import { useState, useEffect } from "react"
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Calendar,
  RefreshCw,
  Search,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Building2,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"

interface TransactionOrder {
  id: number
  orderNumber: string
  status: string
  total: number
  shippingCost?: number
  date?: string
  createdAt?: string
  paymentMethod?: string
  paymentStatus?: string
  paymentProofUrl?: string | null
  paymentSubmittedAt?: string | null
  paymentVerificationStatus?: string | null
  paymentVerifiedAt?: string | null
  isEligibleRevenue?: boolean
  User?: { id: number; name?: string; email?: string; phone?: string }
  Vendor?: { id: number; name?: string; shopName?: string }
  OrderItem?: Array<{
    id: number
    quantity: number
    price: number
    variantName?: string | null
    Product?: { id: number; name: string; image?: string }
  }>
}

export default function AdminTransactionsPage() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<TransactionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState<TransactionOrder | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [paymentStatus, setPaymentStatus] = useState<string>('all')
  const [paymentMethod, setPaymentMethod] = useState<string>('all')
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    pendingRevenue: 0,
    cancelledRevenue: 0,
    totalTransactions: 0,
    paidTransactionsCount: 0,
  })

  const pagination = usePagination({ initialPage: 1, initialLimit: 15 })

  useEffect(() => {
    fetchTransactions()
  }, [dateRange.start, dateRange.end, paymentStatus, paymentMethod, pagination.page, pagination.limit])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/admin/transactions', window.location.origin)
      if (dateRange.start) url.searchParams.append('startDate', dateRange.start)
      if (dateRange.end) url.searchParams.append('endDate', dateRange.end)
      if (paymentStatus !== 'all') url.searchParams.append('paymentStatus', paymentStatus)
      if (paymentMethod !== 'all') url.searchParams.append('paymentMethod', paymentMethod)
      url.searchParams.append('page', String(pagination.page))
      url.searchParams.append('limit', String(pagination.limit))

      const res = await fetch(url)
      if (!res.ok) throw new Error('Không thể tải giao dịch')
      const result = await res.json()

      setTransactions(result.data || [])
      setSummary(result.summary || {
        totalRevenue: 0,
        pendingRevenue: 0,
        cancelledRevenue: 0,
        totalTransactions: 0,
        paidTransactionsCount: 0,
      })
      pagination.setTotal(result.pagination?.total || 0)
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể tải lịch sử giao dịch', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const getMethodBadge = (method?: string) => {
    switch (method) {
      case 'bank':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30"><Building2 className="h-3 w-3 mr-1" /> Chuyển khoản QR</Badge>
      case 'wallet':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30"><Wallet className="h-3 w-3 mr-1" /> Ví điện tử</Badge>
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-800"><Receipt className="h-3 w-3 mr-1" /> COD (Tiền mặt)</Badge>
    }
  }

  const getStatusBadge = (tx: TransactionOrder) => {
    if (tx.status === 'cancelled') {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3.5 w-3.5 mr-1" /> Đã hủy</Badge>
    }
    if (tx.isEligibleRevenue) {
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Đã ghi nhận / Đã thanh toán</Badge>
    }
    return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="h-3.5 w-3.5 mr-1" /> Chờ xác nhận / Chờ giao</Badge>
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-primary" />
            Lịch sử giao dịch & Thanh toán sàn
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi tất cả dòng tiền, giao dịch mua bán và trạng thái thanh toán của sàn
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-card rounded-xl border border-border/80 shadow-sm text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/60 rounded-lg text-muted-foreground font-semibold">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Thời gian</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">Từ:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => {
                const newStart = e.target.value
                setDateRange((prev) => ({
                  start: newStart,
                  end: prev.end || newStart,
                }))
              }}
              className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">Đến:</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDateRange({ start: '', end: '' })}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Đặt lại
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng doanh thu sàn</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {summary.totalRevenue.toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2 font-medium">
              Từ {summary.paidTransactionsCount} đơn đã thanh toán/hoàn tất
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tạm tính / Chờ xử lý</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {summary.pendingRevenue.toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 font-medium">
              Đơn hàng đang giao hoặc chờ xác nhận
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200/60 dark:border-red-900/40 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Giá trị đơn hủy</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {summary.cancelledRevenue.toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-80" />
            </div>
            <p className="text-xs text-red-700 dark:text-red-400 mt-2 font-medium">
              Chỉ dùng đối soát, không tính vào doanh thu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng số giao dịch</p>
                <p className="text-2xl font-bold mt-1">
                  {summary.totalTransactions}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-primary opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tất cả các giao dịch phát sinh
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Options */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase">Lọc theo:</span>
            
            {/* Status Filter */}
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="paid">Đã thanh toán / Đã ghi nhận</option>
              <option value="pending">Chờ xác nhận / Chờ xử lý</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            {/* Method Filter */}
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="all">Tất cả phương thức</option>
              <option value="cod">COD (Thanh toán khi nhận)</option>
              <option value="bank">Chuyển khoản Ngân hàng (QR)</option>
              <option value="wallet">Ví điện tử</option>
            </select>
          </div>

          {(paymentStatus !== 'all' || paymentMethod !== 'all') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPaymentStatus('all')
                setPaymentMethod('all')
              }}
              className="text-xs h-8"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Đặt lại lọc
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center justify-between">
            <span>Danh sách giao dịch</span>
            <span className="text-xs font-normal text-muted-foreground">Hiển thị {transactions.length} / {pagination.total} giao dịch</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Đang tải lịch sử giao dịch...</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Không có giao dịch nào phù hợp với bộ lọc.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-y border-border text-xs text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Mã giao dịch / Đơn</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Nhà bán hàng (Shop)</th>
                    <th className="py-3 px-4">Giá trị giao dịch</th>
                    <th className="py-3 px-4">Phương thức</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-primary">
                        #{tx.orderNumber || tx.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium">{tx.User?.name || 'Khách hàng'}</p>
                        <p className="text-xs text-muted-foreground">{tx.User?.phone || tx.User?.email || ''}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium">{tx.Vendor?.shopName || tx.Vendor?.name || 'Shop'}</p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {Number(tx.total || 0).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-3.5 px-4">
                        {getMethodBadge(tx.paymentMethod)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(tx)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : tx.date || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTx(tx)
                            setDetailOpen(true)
                          }}
                          className="h-8 px-2.5 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-border">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              limit={pagination.limit}
              total={pagination.total}
              onPageChange={pagination.setPage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader className="border-b pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-6 min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-bold truncate break-all min-w-0">
                Chi tiết giao dịch #{selectedTx?.orderNumber || selectedTx?.id}
              </DialogTitle>
              {selectedTx && <div className="shrink-0">{getStatusBadge(selectedTx)}</div>}
            </div>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-4 pt-2 min-w-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-sm bg-muted/40 p-3 sm:p-4 rounded-xl border min-w-0">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Khách hàng</p>
                  <p className="font-semibold truncate">{selectedTx.User?.name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedTx.User?.phone || selectedTx.User?.email || ''}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Nhà bán hàng</p>
                  <p className="font-semibold truncate">{selectedTx.Vendor?.name || 'N/A'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Tổng giá trị</p>
                  <p className="font-bold text-primary text-base truncate">
                    {Number(selectedTx.total || 0).toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Phương thức thanh toán</p>
                  <div className="mt-1">{getMethodBadge(selectedTx.paymentMethod)}</div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Thời gian giao dịch</p>
                  <p className="font-medium text-xs truncate">
                    {selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString('vi-VN') : selectedTx.date}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Trạng thái đơn hàng</p>
                  <p className="font-medium capitalize text-xs">{selectedTx.status}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="min-w-0">
                <h4 className="font-semibold text-sm mb-2">Sản phẩm trong giao dịch</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedTx.OrderItem?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 bg-background rounded-lg border text-xs min-w-0 gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.Product?.image && (
                          <div className="relative h-10 w-10 rounded overflow-hidden shrink-0 border">
                            <Image src={item.Product.image} alt={item.Product.name} fill className="object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{item.Product?.name || 'Sản phẩm'}</p>
                          {item.variantName && <p className="text-muted-foreground truncate">Phân loại: {item.variantName}</p>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold">{Number(item.price || 0).toLocaleString('vi-VN')} ₫</p>
                        <p className="text-muted-foreground">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proof Image if Banking */}
              {selectedTx.paymentProofUrl && (
                <div className="pt-2 border-t min-w-0">
                  <h4 className="font-semibold text-sm mb-2">Ủy nhiệm chi / Ảnh chứng từ thanh toán</h4>
                  <div className="rounded-lg overflow-hidden border bg-muted/20 p-2 flex justify-center max-w-full">
                    <img
                      src={selectedTx.paymentProofUrl}
                      alt="Chứng từ thanh toán"
                      className="max-h-80 sm:max-h-96 max-w-full h-auto object-contain rounded shadow-sm"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.onerror = null
                        target.src = 'https://placehold.co/600x400?text=Minh+Ch%E1%BB%A9ng+Thanh+To%C3%A1n'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
