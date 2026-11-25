'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw, Send, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { ImageMessageComposer } from '@/components/complaints/image-message-composer'
import { ComplaintMessageAttachments } from '@/components/complaints/message-attachments'

type EventItem = { status: string; message: string; createdAt: string }
type Message = { id: number; senderRole: string; senderName: string; message: string; evidenceUrls?: string[]; evidenceNames?: string[]; createdAt: string }
type Complaint = { id: number; caseCode: string; submitterName: string; email: string; phone?: string; categoryName?: string; subject: string; description: string; evidenceUrls: string[]; evidenceNames: string[]; status: string; resolution?: string; customerReplyDeadline?: string; customerRating?: number; customerFeedback?: string; createdAt: string; updatedAt?: string; events: EventItem[] }
const labels: Record<string, string> = { received: 'Chờ tiếp nhận', accepted: 'Đã tiếp nhận', processing: 'Đang xử lý', resolved: 'Đã giải quyết', rejected: 'Từ chối', cancelled: 'Đã hủy' }

export default function AdminComplaintsPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Complaint[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reply, setReply] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [resolution, setResolution] = useState('')
  const [caseTab, setCaseTab] = useState<'all'|'active'|'finished'>('all')
  const activeItems = items.filter(item => !['resolved','rejected','cancelled'].includes(item.status))
  const finishedItems = items.filter(item => ['resolved','rejected','cancelled'].includes(item.status))
  const filteredItems = caseTab === 'active' ? activeItems : caseTab === 'finished' ? finishedItems : items
  const selected = filteredItems.find(item => item.id === selectedId) || filteredItems[0]

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/complaints', { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Không tải được phản ánh.')
      setItems(json.data || [])
      setSelectedId(current => current ?? json.data?.[0]?.id ?? null)
    } catch (error) {
      toast({ title: 'Không tải được dữ liệu', description: error instanceof Error ? error.message : 'Thử lại sau.', variant: 'destructive' })
    } finally { setLoading(false) }
  }, [toast])

  const loadMessages = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/complaints/${id}/messages`, { cache: 'no-store' })
      const json = await response.json()
      if (response.ok) setMessages(json.data || [])
    } catch { /* giữ hội thoại hiện tại trong lúc kết nối lại */ }
  }, [])

  useEffect(() => { void loadAll() }, [loadAll])
  useEffect(() => {
    const stream = new EventSource('/api/admin/complaints/stream')
    let previous = ''
    stream.addEventListener('cases', event => {
      const snapshot = (event as MessageEvent).data
      if (previous && snapshot !== previous) void loadAll()
      previous = snapshot
    })
    return () => stream.close()
  }, [loadAll])
  useEffect(() => {
    if (!selected) { setMessages([]); return }
    setResolution(selected.resolution || '')
    void loadMessages(selected.id)
    const stream = new EventSource(`/api/complaints/${selected.id}/stream`)
    stream.addEventListener('snapshot', event => {
      try {
        const snapshot = JSON.parse((event as MessageEvent).data)
        setMessages(snapshot.messages || [])
        setItems(current => current.map(item => item.id === selected.id ? { ...item, ...snapshot.case, events: snapshot.events || [] } : item))
      } catch { /* chờ snapshot tiếp theo */ }
    })
    return () => stream.close()
  }, [selected?.id, loadMessages])

  async function sendReply() {
    if (!selected || !reply.trim()) return
    setSaving(true)
    try {
      const response = await fetch(`/api/complaints/${selected.id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: reply }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error)
      setReply(''); await loadMessages(selected.id); await loadAll()
    } catch (error) { toast({ title: 'Không gửi được trả lời', description: error instanceof Error ? error.message : 'Thử lại sau.', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  async function updateStatus(nextStatus: 'accepted'|'rejected'|'resolved') {
    if (!selected) return
    const defaultNotes = { accepted: 'Admin đã tiếp nhận phản ánh.', rejected: 'Admin đã từ chối phản ánh.', resolved: 'Admin đã giải quyết phản ánh.' }
    const message = statusNote.trim() || defaultNotes[nextStatus]
    setSaving(true)
    try {
      const response = await fetch('/api/admin/complaints', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected.id, status: nextStatus, message, resolution }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error)
      setStatusNote(''); await loadAll()
    } catch (error) { toast({ title: 'Không cập nhật được', description: error instanceof Error ? error.message : 'Thử lại sau.', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  return <main className="space-y-6 p-4 md:p-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-orange-600">HỖ TRỢ NGƯỜI DÙNG</p><h1 className="text-3xl font-bold">Phản ánh & hội thoại hỗ trợ</h1><p className="mt-1 text-sm text-muted-foreground">Trao đổi trực tiếp và theo dõi trạng thái xử lý.</p></div><div className="flex items-center gap-2"><Button asChild variant="outline"><Link href="/admin/complaints/categories"><Tags className="mr-2 h-4 w-4"/>Quản lý loại</Link></Button><Button variant="outline" onClick={loadAll} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading?'animate-spin':''}`}/>Làm mới</Button></div></header>
    <div className="flex flex-wrap gap-2"><button onClick={()=>{setCaseTab('all');if(items[0])setSelectedId(items[0].id)}} className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${caseTab==='all'?'border-orange-400 bg-orange-50 text-orange-800':''}`}>Tất cả<Badge variant="secondary">{items.length}</Badge></button><button onClick={()=>{setCaseTab('active');if(activeItems[0])setSelectedId(activeItems[0].id)}} className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${caseTab==='active'?'border-orange-400 bg-orange-50 text-orange-800':''}`}>Đang xử lý<Badge variant="secondary">{activeItems.length}</Badge></button><button onClick={()=>{setCaseTab('finished');if(finishedItems[0])setSelectedId(finishedItems[0].id)}} className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${caseTab==='finished'?'border-orange-400 bg-orange-50 text-orange-800':''}`}>Đã kết thúc<Badge variant="secondary">{finishedItems.length}</Badge></button></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.7fr)]"><aside className="max-h-[72vh] space-y-2 overflow-y-auto rounded-xl border bg-white p-3">{!filteredItems.length&&<p className="p-4 text-sm text-muted-foreground">{loading?'Đang tải…':items.length?'Không có phản ánh trong mục này.':'Chưa có phản ánh.'}</p>}{filteredItems.map(item=><button key={item.id} type="button" onClick={()=>setSelectedId(item.id)} className={`w-full rounded-lg border p-3 text-left ${selected?.id===item.id?'border-orange-400 bg-orange-50':'hover:bg-muted/50'}`}><span className="flex items-center justify-between gap-2"><b className="text-sm">{item.caseCode}</b><Badge variant={item.status==='resolved'?'secondary':['rejected','cancelled'].includes(item.status)?'destructive':'outline'}>{labels[item.status]||item.status}</Badge></span><span className="mt-1 block truncate text-sm">{item.categoryName||'Chưa phân loại'} · {item.subject}</span><span className="mt-1 block text-xs text-muted-foreground">{item.submitterName} · {new Date(item.updatedAt||item.createdAt).toLocaleDateString('vi-VN')}</span></button>)}</aside>
      {selected?<section className="space-y-5 rounded-xl border bg-white p-5"><div><p className="text-sm font-semibold text-muted-foreground">{selected.caseCode} · {selected.categoryName||'Chưa phân loại'}</p><p className="mt-2 text-sm">{selected.submitterName} · <a className="text-orange-700 underline" href={`mailto:${selected.email}`}>{selected.email}</a>{selected.phone&&` · ${selected.phone}`}</p><p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm">{selected.description}</p></div>
        
        <div><h3 className="mb-2 font-semibold">Hội thoại với người gửi</h3><div className="max-h-[420px] min-h-40 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4">{messages.length===0&&<p className="text-sm text-muted-foreground">Chưa có tin nhắn.</p>}{messages.map(item=><div key={item.id} className={`max-w-[85%] rounded-xl p-3 text-sm ${item.senderRole==='admin'?'ml-auto bg-orange-100':'bg-white shadow-sm'}`}><p className="mb-1 text-xs font-semibold text-slate-500">{item.senderName}</p><p className="whitespace-pre-wrap">{item.message}</p><ComplaintMessageAttachments ids={item.evidenceUrls} names={item.evidenceNames} endpoint="admin"/><time className="mt-1 block text-right text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</time></div>)}</div>{['resolved','rejected','cancelled'].includes(selected.status)?<p className="mt-2 rounded-lg bg-muted p-3 text-center text-sm">Hồ sơ đã kết thúc. Hội thoại đã khóa.</p>:<div className="mt-2 flex gap-2"><Textarea value={reply} onChange={event=>setReply(event.target.value)} rows={2} maxLength={4000} placeholder="Nhập trả lời cho người dùng…"/><Button className="self-end" disabled={saving||!reply.trim()} onClick={sendReply}><Send className="mr-2 h-4 w-4"/>Gửi</Button></div>}</div>
        {!['resolved','rejected','cancelled'].includes(selected.status)&&<ImageMessageComposer caseId={selected.id} role="admin" onSent={async()=>{await loadMessages(selected.id);await loadAll()}}/>}
        {!!selected.customerRating&&<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"><h3 className="font-semibold">Đánh giá của khách hàng: {selected.customerRating}/5</h3>{selected.customerFeedback&&<p className="mt-1 text-sm">{selected.customerFeedback}</p>}</div>}
        <div className="rounded-lg border p-4"><h3 className="mb-2 font-semibold">Timeline</h3><ol className="space-y-3 border-l pl-4">{selected.events.map((event,index)=><li key={index}><Badge variant="outline">{labels[event.status]||event.status}</Badge><p className="mt-1 text-sm">{event.message}</p><time className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString('vi-VN')}</time></li>)}</ol></div>
        {!['resolved','rejected','cancelled'].includes(selected.status)&&<div className="space-y-3 border-t pt-4"><h3 className="font-semibold">Xử lý phản ánh</h3><p className="text-sm text-muted-foreground">Trạng thái sẽ tự cập nhật theo quá trình trao đổi.</p><Textarea value={statusNote} onChange={event=>setStatusNote(event.target.value)} rows={2} placeholder="Ghi chú xử lý (không bắt buộc)"/>{selected.status==='received'&&<Button disabled={saving} onClick={()=>updateStatus('accepted')}>Tiếp nhận</Button>}<Textarea value={resolution} onChange={event=>setResolution(event.target.value)} rows={2} placeholder="Nội dung giải quyết (nếu đánh dấu đã giải quyết)"/><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={saving} onClick={()=>updateStatus('rejected')}>Từ chối</Button><Button disabled={saving} onClick={()=>updateStatus('resolved')}>Đã giải quyết</Button></div></div>}
      </section>:<section className="rounded-xl border p-8 text-center text-muted-foreground">Chọn phản ánh để mở hội thoại.</section>}</div>
  </main>
}
