'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { FileText, FileUp, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

const policies = [
  { code: 'privacy-policy', title: 'Chính sách bảo mật', audience: 'Client và Seller' },
  { code: 'terms-of-service', title: 'Điều khoản dịch vụ', audience: 'Client và Seller' },
  { code: 'operating-regulations', title: 'Điều kiện hoạt động', audience: 'Client và Seller' },
  { code: 'dispute-resolution', title: 'Cơ chế giải quyết tranh chấp', audience: 'Client và Seller' },
  { code: 'intermediary-payment-agreement', title: 'Hợp đồng trung gian thanh toán', audience: 'Client (thanh toán ví điện tử)' },
]

type LegalDocument = { code: string; title: string; fileName: string; fileUrl: string; updatedAt: string }

export default function LegalDocumentsPage() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<LegalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/legal-documents')
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setDocuments(result.data || [])
    } catch (error) {
      toast({ title: 'Không thể tải tài liệu', description: error instanceof Error ? error.message : 'Vui lòng thử lại.', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleFile = async (policy: typeof policies[number], event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(policy.code)
    try {
      const form = new FormData(); form.append('file', file)
      const upload = await fetch('/api/admin/legal-documents/upload', { method: 'POST', body: form })
      const uploaded = await upload.json()
      if (!upload.ok) throw new Error(uploaded.error)
      const saved = await fetch('/api/admin/legal-documents', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...policy, ...uploaded }) })
      const result = await saved.json()
      if (!saved.ok) throw new Error(result.error)
      setDocuments(current => [...current.filter(item => item.code !== policy.code), result.data])
      toast({ title: 'Đã cập nhật tài liệu', description: `${policy.title} đã sẵn sàng hiển thị.` })
    } catch (error) {
      toast({ title: 'Tải tệp thất bại', description: error instanceof Error ? error.message : 'Vui lòng thử lại.', variant: 'destructive' })
    } finally { setUploading(null) }
  }

  return <main className="p-4 md:p-6">
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-1 text-sm font-medium text-orange-600">NỘI DUNG PHÁP LÝ</p><h1 className="text-3xl font-bold tracking-tight">Tài liệu chính sách</h1><p className="mt-2 max-w-2xl text-muted-foreground">Tải lên hoặc thay thế phiên bản tài liệu công khai. Client và Seller sẽ luôn thấy phiên bản mới nhất.</p></div>
      <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />Làm mới</Button>
    </div>
    <Card className="border-orange-100 bg-orange-50/40"><CardContent className="flex gap-3 p-4 text-sm text-slate-700"><ShieldCheck className="h-5 w-5 shrink-0 text-orange-600" /><p>Chỉ tải tệp PDF (gốc tối đa 20MB; bản lưu tối đa 5MB). Khi thay thế, đường dẫn mới sẽ được công khai.</p></CardContent></Card>
    <section className="mt-5 overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="hidden grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(220px,1.4fr)_150px] gap-4 border-b bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid"><span>Tài liệu</span><span>Đối tượng</span><span>Tệp hiện tại</span><span>Thao tác</span></div>
      {policies.map(policy => {
        const document = documents.find(item => item.code === policy.code)
        const busy = uploading === policy.code
        return <article key={policy.code} className={`grid gap-3 border-b px-5 py-4 last:border-b-0 md:grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(220px,1.4fr)_150px] md:items-center ${document ? 'bg-emerald-50/20' : ''}`}>
          <div><h2 className="font-semibold text-slate-900">{policy.title}</h2><p className="mt-1 text-xs text-slate-500 md:hidden">{policy.audience}</p></div>
          <p className="hidden text-sm text-slate-600 md:block">{policy.audience}</p>
          <div><span className={document ? 'mb-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700' : 'mb-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600'}>{document ? 'Đang áp dụng' : 'Chưa tải lên'}</span>{document ? <><a className="flex max-w-full items-center gap-2 truncate text-sm font-medium text-orange-700 hover:underline" href={document.fileUrl} target="_blank" rel="noreferrer"><FileText className="h-4 w-4 shrink-0" />{document.fileName}</a><p className="mt-1 text-xs text-slate-500">Cập nhật {new Date(document.updatedAt).toLocaleString('vi-VN')}</p></> : <p className="text-sm text-slate-500">Chưa có tệp công khai</p>}</div>
          <div><Button size="sm" variant={document ? 'outline' : 'default'} disabled={busy} asChild><label className="cursor-pointer"><FileUp className="mr-2 h-4 w-4" />{busy ? 'Đang tải...' : document ? 'Thay thế' : 'Tải lên'}<input type="file" className="sr-only" accept="application/pdf,.pdf" onChange={event => handleFile(policy, event)} /></label></Button><p className="mt-2 text-xs text-muted-foreground">Nhận PDF gốc tối đa 20MB; chỉ lưu bản không quá 5MB và tự nén khi có Ghostscript.</p></div>
        </article>
      })}
    </section>
  </main>
}
