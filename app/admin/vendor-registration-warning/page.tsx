'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Warning = { title: string; content: string; version: number; minReadSeconds: number; updatedAt?: string }
type Acceptance = { id: number; userName: string; email: string; shopName: string; warningVersion: number; warningTitle: string; acceptedAt: string }
const PAGE_SIZE = 20

export default function VendorRegistrationWarningPage() {
  const [warning, setWarning] = useState<Warning>({ title: '', content: '', version: 0, minReadSeconds: 20 })
  const [acceptances, setAcceptances] = useState<Acceptance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [configResponse, historyResponse] = await Promise.all([
        fetch('/api/admin/vendor-registration-warning', { cache: 'no-store' }),
        fetch(`/api/admin/vendor-registration-warning?history=1&page=${page}&limit=${PAGE_SIZE}`, { cache: 'no-store' }),
      ])
      const config = await configResponse.json()
      const history = await historyResponse.json()
      if (!configResponse.ok) throw new Error(config.error || 'Không tải được cấu hình cảnh báo.')
      if (!historyResponse.ok) throw new Error(history.error || 'Không tải được lịch sử xác nhận.')
      setWarning(config.warning || { title: '', content: '', version: 0, minReadSeconds: 20 })
      setAcceptances(history.acceptances || [])
      setTotal(history.total || 0)
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Có lỗi xảy ra.') }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { void load() }, [load])

  const save = async () => {
    setSaving(true); setNotice('')
    try {
      const response = await fetch('/api/admin/vendor-registration-warning', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: warning.title, content: warning.content, minReadSeconds: warning.minReadSeconds }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không lưu được cảnh báo.')
      setWarning(result.warning)
      setNotice(`Đã lưu phiên bản ${result.warning.version}. Người đăng ký sẽ phải đọc và xác nhận nội dung mới.`)
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Có lỗi xảy ra.') }
    finally { setSaving(false) }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return <main className="container-viewport space-y-5 py-8">
    <header className="flex items-start gap-3"><AlertTriangle className="mt-1 h-7 w-7 text-amber-600" /><div><h1 className="text-2xl font-bold">Cảnh báo đăng ký nhà bán hàng</h1><p className="mt-1 text-sm text-muted-foreground">Quản lý nội dung popup và lịch sử xác nhận của nhà bán hàng.</p></div></header>
    {notice && <p role="status" className="rounded-md border bg-muted p-3 text-sm">{notice}</p>}
    <Tabs defaultValue="content" className="space-y-4">
      <TabsList><TabsTrigger value="content">Nội dung cảnh báo</TabsTrigger><TabsTrigger value="history">Lịch sử xác nhận ({total})</TabsTrigger></TabsList>
      <TabsContent value="content">
        <Card><CardHeader className="pb-3"><CardTitle>Nội dung popup</CardTitle></CardHeader><CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">Đang tải...</p> : <>
            <label className="block text-sm font-medium">Tiêu đề<Input className="mt-1" value={warning.title} onChange={(event) => setWarning((current) => ({ ...current, title: event.target.value }))} /></label>
            <label className="block text-sm font-medium">Nội dung cảnh báo<textarea className="mt-1 min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-6" value={warning.content} onChange={(event) => setWarning((current) => ({ ...current, content: event.target.value }))} /></label>
            <div className="flex flex-wrap items-end justify-between gap-3"><label className="block max-w-xs text-sm font-medium">Thời gian đọc tối thiểu (giây)<Input className="mt-1" type="number" min={0} max={600} value={warning.minReadSeconds} onChange={(event) => setWarning((current) => ({ ...current, minReadSeconds: Number(event.target.value) }))} /></label><div className="flex flex-wrap items-center gap-3"><span className="text-xs text-muted-foreground">Phiên bản {warning.version || '—'}{warning.updatedAt ? ` · ${new Date(warning.updatedAt).toLocaleString('vi-VN')}` : ''}</span><Button onClick={() => void save()} disabled={saving || !warning.title.trim() || !warning.content.trim()}><Save className="mr-2 h-4 w-4" />{saving ? 'Đang lưu...' : 'Lưu nội dung'}</Button></div></div>
          </>}
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="history">
        <Card><CardHeader className="pb-3"><CardTitle>Lịch sử xác nhận</CardTitle><p className="text-sm text-muted-foreground">{total.toLocaleString('vi-VN')} lượt · mỗi trang {PAGE_SIZE} lượt, mới nhất trước.</p></CardHeader><CardContent className="p-0">
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-y bg-muted/50 text-left"><tr><th className="p-3">Người đăng ký</th><th className="p-3">Cửa hàng</th><th className="p-3">Cảnh báo</th><th className="p-3">Thời điểm xác nhận</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Đang tải...</td></tr> : acceptances.map((record) => <tr key={record.id} className="border-b"><td className="p-3"><p className="font-medium">{record.userName}</p><p className="text-xs text-muted-foreground">{record.email}</p></td><td className="p-3 font-medium">{record.shopName}</td><td className="p-3">v{record.warningVersion} · {record.warningTitle}</td><td className="p-3">{new Date(record.acceptedAt).toLocaleString('vi-VN')}</td></tr>)}{!loading && acceptances.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Chưa có lượt xác nhận.</td></tr>}</tbody></table></div>
          <div className="flex items-center justify-between gap-3 border-t p-3 text-sm"><span className="text-muted-foreground">Trang {page} / {pageCount}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Trước</Button><Button size="sm" variant="outline" disabled={loading || page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Tiếp</Button></div></div>
        </CardContent></Card>
      </TabsContent>
    </Tabs>
  </main>
}
