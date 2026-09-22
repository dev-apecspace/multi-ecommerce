'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Check, CircleAlert, Download, FileText, Lock, Loader2, Percent, ShieldCheck, Store, Unlock, Wallet, X } from 'lucide-react'

interface Vendor {
  id: number; name: string; status: string; joinDate: string; rating: number; products: number; followers: number; orderCount?: number; revenue?: number; description?: string | null
  monthlyFeeConfig?: { feeType?: 'fixed' | 'percentage'; fixedMonthlyFee?: number | string; revenueFeePercent?: number | string; effectiveFrom?: string } | null
  Shop?: { id?: number; name?: string; image?: string; locked?: boolean; lockedReason?: string; ShopDetail?: { email?: string; phone?: string; address?: string; taxId?: string; businessLicense?: string; bankAccount?: string; bankName?: string } } | null
}
interface VendorDocument { id: number; vendorId: number; documentType: string; documentName: string; documentUrl: string; status: string; reviewNotes?: string; uploadedAt: string }
interface VendorModalProps {
  vendor: Vendor | null; documents: VendorDocument[]; isOpen: boolean; onClose: () => void; onSave: (data: any) => void
  onDeleteVendor?: (vendorId: number) => void; onApproveDocument?: (documentId: number, notes: string) => void; onRejectDocument?: (documentId: number, notes: string) => void; loading?: boolean; mode?: 'details' | 'management'
}

const statusText: Record<string, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Bị từ chối' }

function StatusStamp({ status }: { status: string }) {
  const styles = { approved: 'border-emerald-200 bg-emerald-50 text-emerald-700', rejected: 'border-red-200 bg-red-50 text-red-700', pending: 'border-amber-200 bg-amber-50 text-amber-700' }
  return <Badge className={`border font-medium ${styles[status as keyof typeof styles] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>{statusText[status] || status}</Badge>
}

function ReadonlyField({ label, value, className = '' }: { label: string; value?: string | number | null; className?: string }) {
  return <div className={className}><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-900">{value || '-'}</p></div>
}

type FeeHistoryItem = { billingMonth: string; totalFee: number; collectedAmount: number; status: 'uncollected' | 'partially_collected' | 'collected' }
const feeMoney = (value: number) => `${value.toLocaleString('vi-VN')} ₫`

function VendorFeeConfiguration({ config }: { config?: Vendor['monthlyFeeConfig'] }) {
  const isPercentage = config?.feeType === 'percentage'
  const percentage = Number(config?.revenueFeePercent || 0)
  const fixedFee = Number(config?.fixedMonthlyFee || 0)
  const hasConfig = Boolean(config)

  if (!hasConfig) {
    return <section aria-labelledby="fee-config-title" className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3"><div className="flex items-start gap-3"><Wallet className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><div><h2 id="fee-config-title" className="text-sm font-bold text-slate-950">Cấu hình phí hợp tác</h2><p className="mt-1 text-sm text-slate-600">Shop chưa được cấu hình phí hợp tác hàng tháng.</p></div></div></section>
  }

  const policy = isPercentage ? `${percentage.toLocaleString('vi-VN')}% doanh thu` : `${fixedFee.toLocaleString('vi-VN')} ₫/tháng`
  const context = isPercentage
    ? 'Phí được tính trên doanh thu hợp lệ phát sinh trong từng tháng.'
    : 'Phí cố định được áp dụng cho mỗi tháng hợp tác.'

  return <section aria-labelledby="fee-config-title" className="mt-5 overflow-hidden rounded-lg border border-sky-200 bg-sky-50/70"><div className="flex items-start gap-3 px-4 py-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-sky-700 shadow-sm">{isPercentage ? <Percent className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 id="fee-config-title" className="text-sm font-bold text-slate-950">Cấu hình phí hợp tác</h2><Badge variant="outline" className="border-sky-200 bg-white text-xs font-semibold text-sky-800">{isPercentage ? 'Theo doanh thu' : 'Cố định'}</Badge></div><p className="mt-1 text-lg font-bold text-sky-900">{policy}</p><p className="mt-1 text-xs leading-5 text-slate-600">{context}</p></div></div><dl className="grid border-t border-sky-200/80 bg-white/60 text-xs sm:grid-cols-2"><div className="px-4 py-2.5"><dt className="font-medium text-slate-500">Loại tính phí</dt><dd className="mt-0.5 font-semibold text-slate-800">{isPercentage ? 'Tỷ lệ doanh thu hợp lệ' : 'Mức phí theo tháng'}</dd></div><div className="border-t border-sky-200/80 px-4 py-2.5 sm:border-l sm:border-t-0"><dt className="font-medium text-slate-500">Áp dụng từ</dt><dd className="mt-0.5 font-semibold text-slate-800">{config?.effectiveFrom ? new Date(`${config.effectiveFrom}T00:00:00`).toLocaleDateString('vi-VN') : 'Chưa ghi nhận'}</dd></div></dl></section>
}

function VendorFeeHistory({ vendorId, open }: { vendorId: number; open: boolean }) {
  const [month, setMonth] = useState(''); const [items, setItems] = useState<FeeHistoryItem[]>([]); const [totalDebt, setTotalDebt] = useState(0); const [error, setError] = useState('')
  useEffect(() => { if (!open) return; const controller = new AbortController(); void fetch(`/api/admin/vendor-monthly-fees?history=true&vendorId=${vendorId}${month ? `&month=${month}` : ''}`, { signal: controller.signal }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Không thể tải phí hợp tác.'); setItems(data.items || []); setTotalDebt(Number(data.totalDebt || 0)); setError('') }).catch((reason) => { if (reason.name !== 'AbortError') setError(reason.message || 'Không thể tải phí hợp tác.') }); return () => controller.abort() }, [vendorId, open, month])
  const statusText = (status: FeeHistoryItem['status']) => status === 'collected' ? 'Đã thu' : status === 'partially_collected' ? 'Thu một phần' : 'Chưa thu'
  return <section aria-labelledby="fee-history-title" className="border-t border-slate-200 pt-6"><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><h2 id="fee-history-title" className="text-sm font-bold text-slate-950">Phí hợp tác</h2><p className="mt-1 text-xs text-slate-500">Theo dõi phí đã thu và dư nợ theo từng kỳ.</p></div><label className="text-xs font-medium text-slate-600">Lọc theo tháng<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="mt-1 block rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm" /></label></div><div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"><p className="text-xs font-medium text-amber-800">Tổng dư nợ chưa đóng</p><p className="mt-1 text-lg font-bold text-amber-900">{feeMoney(totalDebt)}</p></div>{error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[540px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="p-3">Kỳ phí</th><th className="p-3 text-right">Cần thu</th><th className="p-3 text-right">Đã thu</th><th className="p-3 text-right">Dư nợ</th><th className="p-3 text-center">Trạng thái</th></tr></thead><tbody>{items.length ? items.map((item) => <tr key={item.billingMonth} className="border-t border-slate-100"><td className="p-3 font-medium">{new Date(`${item.billingMonth}T00:00:00`).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</td><td className="p-3 text-right">{feeMoney(Number(item.totalFee || 0))}</td><td className="p-3 text-right">{feeMoney(Number(item.collectedAmount || 0))}</td><td className="p-3 text-right font-medium text-amber-700">{feeMoney(Math.max(0, Number(item.totalFee || 0) - Number(item.collectedAmount || 0)))}</td><td className="p-3 text-center"><span className={item.status === 'collected' ? 'text-emerald-600' : item.status === 'partially_collected' ? 'text-blue-600' : 'text-amber-600'}>{statusText(item.status)}</span></td></tr>) : <tr><td className="p-5 text-center text-slate-500" colSpan={5}>Chưa có kỳ phí nào.</td></tr>}</tbody></table></div>}</section>
}

function VendorBusiness({ vendorId, open }: { vendorId: number; open: boolean }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); const [data, setData] = useState<{ orders: any[]; orderCount: number; revenue: number }>({ orders: [], orderCount: 0, revenue: 0 }); const [selectedOrder, setSelectedOrder] = useState<any>(null)
  useEffect(() => { if (!open) return; void fetch(`/api/admin/vendors?id=${vendorId}&action=orders&month=${month}`).then((response) => response.json()).then((result) => { if (result.orders) setData(result) }) }, [vendorId, open, month])
  return <section aria-labelledby="business-summary-title"><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><h2 id="business-summary-title" className="text-sm font-bold text-slate-950">Kinh doanh</h2><p className="mt-1 text-xs text-slate-500">Đơn hàng và doanh thu theo kỳ đã chọn.</p></div><label className="text-xs font-medium text-slate-600">Tháng<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="mt-1 block rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm" /></label></div><div className="mb-4 grid grid-cols-2 gap-3"><div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">Tổng đơn hàng</p><p className="mt-1 text-xl font-bold text-slate-950">{Number(data.orderCount || 0).toLocaleString('vi-VN')}</p></div><div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-medium text-emerald-700">Doanh thu hợp lệ</p><p className="mt-1 text-xl font-bold text-emerald-800">{feeMoney(Number(data.revenue || 0))}</p></div></div><div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[600px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="p-3">Mã đơn</th><th className="p-3">Ngày tạo</th><th className="p-3 text-right">Tổng tiền</th><th className="p-3 text-center">Trạng thái</th><th className="p-3 text-center">Thanh toán</th></tr></thead><tbody>{data.orders.length ? data.orders.map((order) => <tr key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"><td className="p-3 font-medium text-primary">{order.orderNumber || `#${order.id}`}</td><td className="p-3">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td><td className="p-3 text-right">{feeMoney(Number(order.total || 0))}</td><td className="p-3 text-center">{order.status}</td><td className="p-3 text-center">{order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</td></tr>) : <tr><td className="p-5 text-center text-slate-500" colSpan={5}>Không có đơn hàng trong tháng này.</td></tr>}</tbody></table></div><VendorOrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} /></section>
}

function VendorOrderDetails({ order, onClose }: { order: any; onClose: () => void }) {
  if (!order) return null
  return <Dialog open={!!order} onOpenChange={(value) => !value && onClose()}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Chi tiết đơn {order.orderNumber || `#${order.id}`}</DialogTitle></DialogHeader><Tabs defaultValue="info"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="info">Thông tin</TabsTrigger><TabsTrigger value="items">Sản phẩm</TabsTrigger><TabsTrigger value="payment">Thanh toán</TabsTrigger></TabsList><TabsContent value="info" className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><p className="text-muted-foreground">Khách hàng</p><p className="font-medium">{order.User?.name || '—'}</p><p className="text-xs text-muted-foreground">{order.User?.email || ''}</p></div><div><p className="text-muted-foreground">Ngày tạo</p><p className="font-medium">{new Date(order.createdAt).toLocaleString('vi-VN')}</p></div><div><p className="text-muted-foreground">Trạng thái đơn</p><p className="font-medium">{order.status}</p></div><div><p className="text-muted-foreground">Tổng tiền</p><p className="font-medium">{feeMoney(order.total)}</p></div></TabsContent><TabsContent value="items" className="mt-4 space-y-2">{(order.OrderItem || []).map((item: any) => <div key={item.id} className="flex justify-between rounded border p-3 text-sm"><div><p className="font-medium">{item.Product?.name || 'Sản phẩm'}</p><p className="text-muted-foreground">{item.variantName || item.ProductVariant?.name || ''} × {item.quantity}</p></div><p className="font-medium">{feeMoney(Number(item.price || 0) * Number(item.quantity || 0))}</p></div>)}</TabsContent><TabsContent value="payment" className="mt-4 space-y-3 text-sm"><p>Phương thức: <strong>{order.paymentMethod === 'bank' ? 'Chuyển khoản' : order.paymentMethod === 'wallet' ? 'Ví điện tử' : order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : order.paymentMethod || '—'}</strong></p><p>Trạng thái: <strong>{order.paymentStatus === 'paid' ? 'Đã thanh toán' : order.paymentStatus === 'submitted' ? 'Đã gửi minh chứng' : 'Chờ thanh toán'}</strong></p>{order.paymentSubmittedAt && <p>Gửi minh chứng: {new Date(order.paymentSubmittedAt).toLocaleString('vi-VN')}</p>}{order.paymentProofUrl && <a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded border"><img src={order.paymentProofUrl} alt="Minh chứng thanh toán" className="max-h-80 w-full object-contain" /></a>}{order.paymentVerificationStatus && order.paymentVerificationStatus !== 'pending' && <p className="rounded bg-muted p-3">Đối soát: {order.paymentVerificationStatus === 'verified' ? 'Thông tin ảnh khớp đơn hàng' : order.paymentVerificationStatus === 'rejected' ? 'Ảnh chưa được nhận diện là giao dịch' : 'Cần kiểm tra thủ công'}{order.paymentVerificationData?.reason ? ` — ${order.paymentVerificationData.reason}` : ''}</p>}</TabsContent></Tabs></DialogContent></Dialog>
}

export default function AdminVendorModal({ vendor, documents, isOpen, onClose, onSave, onApproveDocument, onRejectDocument, loading = false }: VendorModalProps) {
  const { toast } = useToast()
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({})
  const [newStatus, setNewStatus] = useState(vendor?.status || 'pending')
  const [showLockDialog, setShowLockDialog] = useState(false)
  const [lockReason, setLockReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [monthlyFeeConfig, setMonthlyFeeConfig] = useState<Vendor['monthlyFeeConfig']>(vendor?.monthlyFeeConfig || null)
  const [showFeeDialog, setShowFeeDialog] = useState(false)
  const [feeType, setFeeType] = useState<'percentage' | 'fixed'>('percentage')
  const [revenueFeePercent, setRevenueFeePercent] = useState('')
  const [fixedMonthlyFee, setFixedMonthlyFee] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10))
  const [feeError, setFeeError] = useState('')

  useEffect(() => {
    setNewStatus(vendor?.status || 'pending'); setReviewNotes({}); setMonthlyFeeConfig(vendor?.monthlyFeeConfig || null)
    const config = vendor?.monthlyFeeConfig
    setFeeType(config?.feeType === 'fixed' ? 'fixed' : 'percentage')
    setRevenueFeePercent(config?.revenueFeePercent?.toString() || '')
    setFixedMonthlyFee(config?.fixedMonthlyFee?.toString() || '')
    setEffectiveFrom(config?.effectiveFrom?.slice(0, 10) || new Date().toISOString().slice(0, 10))
    setFeeError(''); setShowFeeDialog(false)
  }, [vendor?.id, vendor?.status, vendor?.monthlyFeeConfig, isOpen])
  // Hồ sơ bị từ chối được ẩn khỏi tiến độ xét duyệt hiện hành; shop có thể nộp hồ sơ thay thế.
  const activeDocuments = useMemo(() => documents.filter((doc) => doc.status !== 'rejected'), [documents])
  const summary = useMemo(() => ({ approved: activeDocuments.filter((doc) => doc.status === 'approved').length, outstanding: activeDocuments.filter((doc) => doc.status !== 'approved').length, total: activeDocuments.length }), [activeDocuments])
  if (!vendor) return null
  const isLocked = Boolean(vendor.Shop?.locked)
  const feePolicyLabel = monthlyFeeConfig
    ? monthlyFeeConfig.feeType === 'percentage'
      ? `${Number(monthlyFeeConfig.revenueFeePercent || 0).toLocaleString('vi-VN')}% doanh thu`
      : `${Number(monthlyFeeConfig.fixedMonthlyFee || 0).toLocaleString('vi-VN')} ₫/tháng`
    : ''
  const feeEffectiveDate = monthlyFeeConfig?.effectiveFrom
    ? new Date(`${monthlyFeeConfig.effectiveFrom}T00:00:00`).toLocaleDateString('vi-VN')
    : ''
  const approvalBlocker = summary.total === 0
    ? 'Chưa có hồ sơ hợp lệ để xét duyệt.'
    : summary.outstanding > 0
      ? `Còn ${summary.outstanding} hồ sơ cần phê duyệt trước khi duyệt shop.`
      : !monthlyFeeConfig
        ? 'Chưa cấu hình phí hợp tác hàng tháng. Bấm “Duyệt shop” để thiết lập.'
        : ''

  const handleStatusChange = async (value: string) => {
    if (value === vendor.status) return
    if (value === 'approved' && summary.outstanding > 0) {
      toast({ title: 'Cần duyệt hồ sơ trước', description: `Còn ${summary.outstanding} hồ sơ chưa được phê duyệt. Hãy xử lý hồ sơ bên trên trước khi duyệt shop.`, variant: 'destructive' })
      setNewStatus(vendor.status)
      return
    }
    if (value === 'approved' && !monthlyFeeConfig) {
      setFeeError('')
      setShowFeeDialog(true)
      toast({ title: 'Cần cấu hình phí hợp tác', description: 'Hãy lưu cấu hình phí hàng tháng trước khi duyệt shop.' })
      return
    }
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/vendors?id=${vendor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: value }) })
      if (!response.ok) throw new Error()
      setNewStatus(value); toast({ title: 'Thành công', description: `Đã cập nhật trạng thái shop thành “${statusText[value] || value}”.` }); onSave({ status: value })
    } catch { toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái shop.', variant: 'destructive' }); setNewStatus(vendor.status) } finally { setIsProcessing(false) }
  }
  const handleSaveFeeConfiguration = async () => {
    const percentage = Number(revenueFeePercent)
    const fixedFee = Number(fixedMonthlyFee)
    if (feeType === 'percentage' && (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100)) {
      setFeeError('Tỷ lệ doanh thu phải lớn hơn 0% và không vượt quá 100%.')
      return
    }
    if (feeType === 'fixed' && (!Number.isFinite(fixedFee) || fixedFee < 0)) {
      setFeeError('Phí cố định phải là số tiền từ 0 ₫ trở lên.')
      return
    }
    if (!effectiveFrom) { setFeeError('Vui lòng chọn ngày áp dụng.'); return }
    setIsProcessing(true); setFeeError('')
    try {
      const response = await fetch(`/api/admin/vendors?id=${vendor.id}&action=fee-config`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeType, revenueFeePercent: feeType === 'percentage' ? percentage : 0, fixedMonthlyFee: feeType === 'fixed' ? fixedFee : 0, effectiveFrom }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không thể lưu cấu hình phí.')
      const config = result.config as Vendor['monthlyFeeConfig']
      setMonthlyFeeConfig(config); setShowFeeDialog(false)
      toast({ title: 'Đã lưu cấu hình phí', description: 'Bạn có thể tiếp tục duyệt shop khi hồ sơ đã hợp lệ.' })
    } catch (error) { setFeeError(error instanceof Error ? error.message : 'Không thể lưu cấu hình phí.') } finally { setIsProcessing(false) }
  }
  const handleLock = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/vendors?id=${vendor.id}&action=lock`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: lockReason }) })
      if (!response.ok) throw new Error()
      toast({ title: 'Thành công', description: 'Đã khóa shop.' }); setShowLockDialog(false); setLockReason(''); onSave({})
    } catch { toast({ title: 'Lỗi', description: 'Không thể khóa shop.', variant: 'destructive' }) } finally { setIsProcessing(false) }
  }
  const handleUnlock = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/vendors?id=${vendor.id}&action=unlock`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      if (!response.ok) throw new Error()
      toast({ title: 'Thành công', description: 'Đã mở khóa shop.' }); onSave({})
    } catch { toast({ title: 'Lỗi', description: 'Không thể mở khóa shop.', variant: 'destructive' }) } finally { setIsProcessing(false) }
  }

  return <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0 sm:rounded-xl">
      <DialogHeader className="border-b bg-slate-50 px-6 py-5 pr-12">
        <div className="flex flex-wrap items-center gap-2"><DialogTitle className="text-lg font-bold text-slate-950">Hồ sơ xét duyệt: {vendor.name}</DialogTitle><StatusStamp status={newStatus} />{isLocked && <Badge className="border-red-200 bg-red-50 text-red-700"><Lock className="mr-1 h-3 w-3" />Đã khóa</Badge>}</div>
        <p className="mt-1 text-sm text-slate-500">Xem thông tin, kiểm tra hồ sơ và cập nhật trạng thái shop trong một phiên duyệt.</p>
      </DialogHeader>
      <div className="max-h-[calc(90vh-174px)] overflow-y-auto px-6 py-5"><Tabs defaultValue="info" className="space-y-5"><TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4"><TabsTrigger value="info">Thông tin</TabsTrigger><TabsTrigger value="business">Kinh doanh</TabsTrigger><TabsTrigger value="fees">Phí hợp tác</TabsTrigger><TabsTrigger value="documents">Hồ sơ & quản lý</TabsTrigger></TabsList>
        <TabsContent value="info"><section aria-labelledby="shop-information-title"><div className="mb-3 flex items-center gap-2"><Store className="h-4 w-4 text-slate-700" /><h2 id="shop-information-title" className="text-sm font-bold text-slate-950">Thông tin cửa hàng</h2></div>
          <div className="grid gap-x-6 gap-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
            <ReadonlyField label="Tên shop" value={vendor.name} /><ReadonlyField label="Ngày tham gia" value={new Date(vendor.joinDate).toLocaleDateString('vi-VN')} />
            <ReadonlyField label="Email" value={vendor.Shop?.ShopDetail?.email} /><ReadonlyField label="Số điện thoại" value={vendor.Shop?.ShopDetail?.phone} />
            <ReadonlyField label="Địa chỉ" value={vendor.Shop?.ShopDetail?.address} className="sm:col-span-2" /><ReadonlyField label="Mã số thuế" value={vendor.Shop?.ShopDetail?.taxId} />
            <ReadonlyField label="Số giấy phép kinh doanh" value={vendor.Shop?.ShopDetail?.businessLicense} /><ReadonlyField label="Mô tả shop" value={vendor.description} className="sm:col-span-2" />
          </div>
          <VendorFeeConfiguration config={monthlyFeeConfig} />
        </section></TabsContent>
        <TabsContent value="business"><VendorBusiness vendorId={vendor.id} open={isOpen} /></TabsContent>
        <TabsContent value="fees"><VendorFeeHistory vendorId={vendor.id} open={isOpen} /></TabsContent>
        <TabsContent value="documents"><section aria-labelledby="documents-title">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate-700" /><h2 id="documents-title" className="text-sm font-bold text-slate-950">Hồ sơ xét duyệt</h2></div><span className="text-xs text-slate-500">{summary.approved}/{summary.total} hồ sơ hợp lệ đã duyệt</span></div>
          <div className={`mb-4 flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${summary.outstanding === 0 && summary.total > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
            {summary.outstanding === 0 && summary.total > 0 ? <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" /> : <CircleAlert className="h-4 w-4 shrink-0 text-amber-600" />}<span>{summary.outstanding === 0 && summary.total > 0 ? 'Tất cả hồ sơ hợp lệ đã được xác minh. Shop đủ điều kiện để phê duyệt.' : 'Duyệt toàn bộ hồ sơ hợp lệ trước, sau đó mới có thể phê duyệt shop.'}</span>
          </div>
          {activeDocuments.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">Chưa có hồ sơ hợp lệ để xét duyệt.</div> : <div className="space-y-3">{activeDocuments.map((document) => <article key={document.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{document.documentName}</p><p className="mt-0.5 text-xs text-slate-500">{document.documentType} · Tải lên {new Date(document.uploadedAt).toLocaleDateString('vi-VN')}</p></div></div><StatusStamp status={document.status} /></div>
            <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => window.open(document.documentUrl, '_blank', 'noopener,noreferrer')}><Download className="mr-1.5 h-3.5 w-3.5" />Xem tài liệu</Button></div>
            {document.status === 'pending' && <div className="mt-3 border-t border-slate-100 pt-3"><Label htmlFor={`notes-${document.id}`} className="text-xs text-slate-600">Nhận xét xét duyệt (tùy chọn)</Label><Textarea id={`notes-${document.id}`} className="mt-1.5 min-h-[68px] text-sm" placeholder="Ghi chú cho shop..." value={reviewNotes[document.id] || ''} onChange={(event) => setReviewNotes((previous) => ({ ...previous, [document.id]: event.target.value }))} /><div className="mt-2 flex flex-col gap-2 sm:flex-row"><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onApproveDocument?.(document.id, reviewNotes[document.id] || '')} disabled={loading || isProcessing}><Check className="mr-1.5 h-3.5 w-3.5" />Phê duyệt tài liệu</Button><Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => onRejectDocument?.(document.id, reviewNotes[document.id] || '')} disabled={loading || isProcessing}><X className="mr-1.5 h-3.5 w-3.5" />Từ chối tài liệu</Button></div></div>}
            {document.reviewNotes && <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600"><strong className="text-slate-700">Nhận xét:</strong> {document.reviewNotes}</p>}
          </article>)}</div>}
        </section><section aria-labelledby="status-management-title" className="mt-6 border-t border-slate-200 pt-6"><div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-slate-700" /><h2 id="status-management-title" className="text-sm font-bold text-slate-950">Quản lý trạng thái</h2></div>
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><Label className="text-xs text-slate-600">Trạng thái phê duyệt shop</Label><div className="mt-1.5 flex flex-wrap items-center gap-2"><StatusStamp status={newStatus} />{monthlyFeeConfig && <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"><Check className="h-3.5 w-3.5" />{feePolicyLabel}</span>}</div></div><div className="flex flex-wrap gap-2"><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusChange('approved')} aria-describedby={approvalBlocker ? 'vendor-approval-blocker' : undefined} disabled={isProcessing || newStatus === 'approved' || summary.outstanding > 0 || summary.total === 0}><Check className="mr-1.5 h-4 w-4" />Duyệt shop</Button><Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => handleStatusChange('rejected')} disabled={isProcessing || newStatus === 'rejected'}><X className="mr-1.5 h-4 w-4" />Từ chối shop</Button></div></div>
            {approvalBlocker && <div id="vendor-approval-blocker" role="status" className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs font-medium ${summary.outstanding > 0 || summary.total === 0 ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-sky-200 bg-sky-50 text-sky-900'}`}><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{approvalBlocker}</span></div>}
            {monthlyFeeConfig && <div role="status" className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" /><span><strong>Đã cấu hình phí:</strong> {feePolicyLabel}{feeEffectiveDate ? ` · Áp dụng từ ${feeEffectiveDate}` : ''}</span></div>}
            <div className="border-t border-slate-200 pt-4">{!isLocked ? <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setShowLockDialog(true)} disabled={isProcessing}><Lock className="mr-1.5 h-4 w-4" />Khóa shop</Button> : <Button variant="outline" onClick={handleUnlock} disabled={isProcessing}>{isProcessing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Unlock className="mr-1.5 h-4 w-4" />}Mở khóa shop</Button>}</div>
          </div>
          {isLocked && vendor.Shop?.lockedReason && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"><span className="font-semibold">Lý do khóa:</span> {vendor.Shop.lockedReason}</div>}
        </section></TabsContent></Tabs>
      </div>
      <DialogFooter className="border-t bg-slate-50 px-6 py-4"><Button variant="outline" onClick={onClose} disabled={loading || isProcessing}>Đóng</Button></DialogFooter>
    </DialogContent>
    <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}><AlertDialogContent className="max-w-md"><AlertDialogHeader><AlertDialogTitle>Khóa shop</AlertDialogTitle><AlertDialogDescription>Nhập lý do để thông báo cho shop về việc khóa tài khoản.</AlertDialogDescription></AlertDialogHeader><Textarea placeholder="Lý do khóa shop..." value={lockReason} onChange={(event) => setLockReason(event.target.value)} className="min-h-[100px]" /><div className="flex justify-end gap-2"><AlertDialogCancel disabled={isProcessing}>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleLock} disabled={isProcessing || !lockReason.trim()} className="bg-red-600 hover:bg-red-700">{isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Xác nhận khóa</AlertDialogAction></div></AlertDialogContent></AlertDialog>
    <Dialog open={showFeeDialog} onOpenChange={(open) => { if (!isProcessing) { setShowFeeDialog(open); if (!open) setFeeError('') } }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Cấu hình phí hợp tác hàng tháng</DialogTitle></DialogHeader>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">Shop đã đủ điều kiện hồ sơ. Cần lưu cấu hình phí trước khi duyệt.</p>
        <div className="space-y-4 py-1">
          <fieldset><legend className="text-sm font-medium text-slate-900">Cách tính phí</legend><div className="mt-2 grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-1" role="radiogroup" aria-label="Cách tính phí hợp tác">
            <label className={`relative cursor-pointer rounded-md px-3 py-2.5 text-left transition-colors focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-1 ${feeType === 'percentage' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}><input type="radio" name="vendor-fee-type" value="percentage" checked={feeType === 'percentage'} onChange={() => { setFeeType('percentage'); setFeeError('') }} className="sr-only" /><span className="flex items-center gap-1.5 text-sm font-semibold">{feeType === 'percentage' && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20"><Check className="h-3 w-3" /></span>}Theo % doanh thu</span><span className={`mt-0.5 block text-[11px] leading-4 ${feeType === 'percentage' ? 'text-sky-100' : 'text-slate-500'}`}>Tính theo doanh thu hợp lệ</span></label>
            <label className={`relative cursor-pointer rounded-md px-3 py-2.5 text-left transition-colors focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-1 ${feeType === 'fixed' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}><input type="radio" name="vendor-fee-type" value="fixed" checked={feeType === 'fixed'} onChange={() => { setFeeType('fixed'); setFeeError('') }} className="sr-only" /><span className="flex items-center gap-1.5 text-sm font-semibold">{feeType === 'fixed' && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20"><Check className="h-3 w-3" /></span>}Phí cố định</span><span className={`mt-0.5 block text-[11px] leading-4 ${feeType === 'fixed' ? 'text-sky-100' : 'text-slate-500'}`}>Áp dụng một mức mỗi tháng</span></label>
          </div></fieldset>
          {feeType === 'percentage' ? <div><Label htmlFor="vendor-fee-percent">Tỷ lệ doanh thu (%)</Label><Input id="vendor-fee-percent" inputMode="decimal" type="number" min="0.01" max="100" step="0.01" value={revenueFeePercent} onChange={(event) => { setRevenueFeePercent(event.target.value); setFeeError('') }} placeholder="Ví dụ: 10" className="mt-1.5" /><p className="mt-1 text-xs text-slate-500">Từ trên 0% đến 100% doanh thu hợp lệ.</p></div> : <div><Label htmlFor="vendor-fixed-fee">Phí cố định mỗi tháng (₫)</Label><Input id="vendor-fixed-fee" inputMode="numeric" type="number" min="0" step="1000" value={fixedMonthlyFee} onChange={(event) => { setFixedMonthlyFee(event.target.value); setFeeError('') }} placeholder="Ví dụ: 500000" className="mt-1.5" /><p className="mt-1 text-xs text-slate-500">Nhập số tiền VNĐ áp dụng cho mỗi tháng.</p></div>}
          <div><Label htmlFor="vendor-fee-effective-from">Áp dụng từ ngày</Label><Input id="vendor-fee-effective-from" type="date" value={effectiveFrom} onChange={(event) => { setEffectiveFrom(event.target.value); setFeeError('') }} className="mt-1.5" /></div>
          {feeError && <p role="alert" className="text-sm font-medium text-red-600">{feeError}</p>}
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setShowFeeDialog(false)} disabled={isProcessing}>Hủy</Button><Button type="button" onClick={handleSaveFeeConfiguration} disabled={isProcessing}>{isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu cấu hình</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </Dialog>
}
