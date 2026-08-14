'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Check, CircleAlert, Download, FileText, Lock, Loader2, ShieldCheck, Store, Unlock, X } from 'lucide-react'

interface Vendor {
  id: number; name: string; status: string; joinDate: string; rating: number; products: number; followers: number; description?: string | null
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

export default function AdminVendorModal({ vendor, documents, isOpen, onClose, onSave, onApproveDocument, onRejectDocument, loading = false }: VendorModalProps) {
  const { toast } = useToast()
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({})
  const [newStatus, setNewStatus] = useState(vendor?.status || 'pending')
  const [showLockDialog, setShowLockDialog] = useState(false)
  const [lockReason, setLockReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => { setNewStatus(vendor?.status || 'pending'); setReviewNotes({}) }, [vendor?.id, vendor?.status, isOpen])
  // Hồ sơ bị từ chối được ẩn khỏi tiến độ xét duyệt hiện hành; shop có thể nộp hồ sơ thay thế.
  const activeDocuments = useMemo(() => documents.filter((doc) => doc.status !== 'rejected'), [documents])
  const summary = useMemo(() => ({ approved: activeDocuments.filter((doc) => doc.status === 'approved').length, outstanding: activeDocuments.filter((doc) => doc.status !== 'approved').length, total: activeDocuments.length }), [activeDocuments])
  if (!vendor) return null
  const isLocked = Boolean(vendor.Shop?.locked)

  const handleStatusChange = async (value: string) => {
    if (value === vendor.status) return
    if (value === 'approved' && summary.outstanding > 0) {
      toast({ title: 'Cần duyệt hồ sơ trước', description: `Còn ${summary.outstanding} hồ sơ chưa được phê duyệt. Hãy xử lý hồ sơ bên trên trước khi duyệt shop.`, variant: 'destructive' })
      setNewStatus(vendor.status)
      return
    }
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/vendors?id=${vendor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: value }) })
      if (!response.ok) throw new Error()
      setNewStatus(value); toast({ title: 'Thành công', description: `Đã cập nhật trạng thái shop thành “${statusText[value] || value}”.` }); onSave({ status: value })
    } catch { toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái shop.', variant: 'destructive' }); setNewStatus(vendor.status) } finally { setIsProcessing(false) }
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
      <div className="max-h-[calc(90vh-174px)] space-y-6 overflow-y-auto px-6 py-5">
        <section aria-labelledby="shop-information-title"><div className="mb-3 flex items-center gap-2"><Store className="h-4 w-4 text-slate-700" /><h2 id="shop-information-title" className="text-sm font-bold text-slate-950">Thông tin cửa hàng</h2></div>
          <div className="grid gap-x-6 gap-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
            <ReadonlyField label="Tên shop" value={vendor.name} /><ReadonlyField label="Ngày tham gia" value={new Date(vendor.joinDate).toLocaleDateString('vi-VN')} />
            <ReadonlyField label="Email" value={vendor.Shop?.ShopDetail?.email} /><ReadonlyField label="Số điện thoại" value={vendor.Shop?.ShopDetail?.phone} />
            <ReadonlyField label="Địa chỉ" value={vendor.Shop?.ShopDetail?.address} className="sm:col-span-2" /><ReadonlyField label="Mã số thuế" value={vendor.Shop?.ShopDetail?.taxId} />
            <ReadonlyField label="Số giấy phép kinh doanh" value={vendor.Shop?.ShopDetail?.businessLicense} /><ReadonlyField label="Mô tả shop" value={vendor.description} className="sm:col-span-2" />
          </div>
        </section>
        <section aria-labelledby="documents-title" className="border-t border-slate-200 pt-6">
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
        </section>
        <section aria-labelledby="status-management-title" className="border-t border-slate-200 pt-6"><div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-slate-700" /><h2 id="status-management-title" className="text-sm font-bold text-slate-950">Quản lý trạng thái</h2></div>
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><Label className="text-xs text-slate-600">Trạng thái phê duyệt shop</Label><div className="mt-1.5"><StatusStamp status={newStatus} /></div></div><div className="flex flex-wrap gap-2"><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusChange('approved')} disabled={isProcessing || newStatus === 'approved' || summary.outstanding > 0 || summary.total === 0}><Check className="mr-1.5 h-4 w-4" />Duyệt shop</Button><Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => handleStatusChange('rejected')} disabled={isProcessing || newStatus === 'rejected'}><X className="mr-1.5 h-4 w-4" />Từ chối shop</Button></div></div>
            <div className="border-t border-slate-200 pt-4">{!isLocked ? <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setShowLockDialog(true)} disabled={isProcessing}><Lock className="mr-1.5 h-4 w-4" />Khóa shop</Button> : <Button variant="outline" onClick={handleUnlock} disabled={isProcessing}>{isProcessing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Unlock className="mr-1.5 h-4 w-4" />}Mở khóa shop</Button>}</div>
          </div>
          {isLocked && vendor.Shop?.lockedReason && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"><span className="font-semibold">Lý do khóa:</span> {vendor.Shop.lockedReason}</div>}
        </section>
      </div>
      <DialogFooter className="border-t bg-slate-50 px-6 py-4"><Button variant="outline" onClick={onClose} disabled={loading || isProcessing}>Đóng</Button></DialogFooter>
    </DialogContent>
    <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}><AlertDialogContent className="max-w-md"><AlertDialogHeader><AlertDialogTitle>Khóa shop</AlertDialogTitle><AlertDialogDescription>Nhập lý do để thông báo cho shop về việc khóa tài khoản.</AlertDialogDescription></AlertDialogHeader><Textarea placeholder="Lý do khóa shop..." value={lockReason} onChange={(event) => setLockReason(event.target.value)} className="min-h-[100px]" /><div className="flex justify-end gap-2"><AlertDialogCancel disabled={isProcessing}>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleLock} disabled={isProcessing || !lockReason.trim()} className="bg-red-600 hover:bg-red-700">{isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Xác nhận khóa</AlertDialogAction></div></AlertDialogContent></AlertDialog>
  </Dialog>
}
