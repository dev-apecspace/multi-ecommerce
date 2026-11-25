'use client'

import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ChevronRight, Paperclip, Send, X, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth-context'
import { ImageMessageComposer } from '@/components/complaints/image-message-composer'
import { ComplaintRating } from '@/components/client/complaint-rating'
import { Badge } from '@/components/ui/badge'
import { ComplaintStatusTracker } from '@/components/client/complaint-status-tracker'
import { ComplaintMessageAttachments } from '@/components/complaints/message-attachments'

type EventItem = { status: string; message: string; createdAt: string }
type CaseData = { id: number; caseCode: string; categoryId: number; categoryName: string; subject: string; description: string; status: string; resolution?: string; customerReplyDeadline?: string; customerRating?: number; customerFeedback?: string; ratedAt?: string; createdAt: string; evidenceUrls: string[]; evidenceNames: string[]; events: EventItem[] }
type Category = { id: number; name: string; groupName: string }
type Message = { id: number; senderRole: string; senderName: string; message: string; evidenceUrls?: string[]; evidenceNames?: string[]; createdAt: string }
type Evidence = { id: string; name: string; size: number }
const labels: Record<string, string> = { received: 'Chờ tiếp nhận', accepted: 'Đã tiếp nhận', processing: 'Đang xử lý', resolved: 'Đã giải quyết', rejected: 'Từ chối', cancelled: 'Đã hủy' }

function ComplaintPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [cases, setCases] = useState<CaseData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [group, setGroup] = useState<'general'|'service'>('general')
  const [categorySearch, setCategorySearch] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [evidence, setEvidence] = useState<File[]>([])
  const [form, setForm] = useState({ description: '' })
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [mode, setMode] = useState<'home'|'new'|'chat'>('home')
  const [historyTab, setHistoryTab] = useState<'active'|'completed'>('active')
  const selected = cases.find(item => item.id === selectedId) || null
  const activeCases = cases.filter(item => !['resolved','rejected','cancelled'].includes(item.status))
  const completedCases = cases.filter(item => ['resolved','rejected','cancelled'].includes(item.status))
  const displayedCases = historyTab === 'active' ? activeCases : completedCases
  const chatItems = selected ? [
    ...messages.map(item => ({ id: `m-${item.id}`, kind: 'message' as const, senderRole: item.senderRole, senderName: item.senderName, status: '', message: item.message, evidenceUrls: item.evidenceUrls || [], evidenceNames: item.evidenceNames || [], createdAt: item.createdAt })),
  ].sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()) : []

  const loadCases = useCallback(async () => {
    const response = await fetch('/api/complaints', { credentials: 'include', cache: 'no-store' })
    const json = await response.json(); if (!response.ok) throw new Error(json.error || 'Không thể tải phản ánh.')
    setCases(json.data || [])
    return json.data as CaseData[]
  }, [])
  const loadMessages = useCallback(async (id: number) => {
    try { const response=await fetch(`/api/complaints/${id}/messages`,{cache:'no-store'}); const json=await response.json(); if(response.ok)setMessages(json.data||[]) }
    catch { /* retain the current conversation while reconnecting */ }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace(`/auth/login?callback=${encodeURIComponent('/client/khieu-nai')}`); return }
    Promise.all([loadCases(), fetch('/api/complaint-categories').then(async response => { const json=await response.json(); if(!response.ok)throw new Error(json.error); setCategories(json.data||[]) })]).catch(error=>setNotice(error instanceof Error?error.message:'Không thể tải trung tâm hỗ trợ.'))
  }, [authLoading,user,router,loadCases])
  useEffect(() => {
    if (!user) return
    const stream = new EventSource('/api/complaints/updates/stream')
    stream.addEventListener('cases', event => {
      try {
        const latest = JSON.parse((event as MessageEvent).data) as Array<{id:number;status:string;updatedAt:string}>
        setCases(current => current.map(item => {
          const update = latest.find(entry => entry.id === item.id)
          return update ? { ...item, status: update.status, updatedAt: update.updatedAt } : item
        }))
        if (latest.length !== cases.length) void loadCases()
      } catch { /* wait for next snapshot */ }
    })
    return () => stream.close()
  }, [user, cases.length, loadCases])
  useEffect(() => {
    const caseId = Number(searchParams.get('case'))
    if (Number.isInteger(caseId) && caseId > 0) { setSelectedId(caseId); setMode('chat') }
  }, [searchParams])
  useEffect(() => {
    if (!selected) { setMessages([]); return }
    void loadMessages(selected.id)
    const stream = new EventSource(`/api/complaints/${selected.id}/stream`)
    stream.addEventListener('snapshot', event => {
      try {
        const snapshot = JSON.parse((event as MessageEvent).data)
        setMessages(snapshot.messages || [])
        setCases(current => current.map(item => item.id === selected.id ? { ...item, ...snapshot.case, events: snapshot.events || [] } : item))
      } catch { /* wait for next valid snapshot */ }
    })
    return () => stream.close()
  },[selected?.id,loadMessages])

  async function createRequest(event: FormEvent) {
    event.preventDefault(); if(!selectedCategory)return
    setBusy(true);setNotice('')
    try {
      const uploaded:Evidence[]=[]
      for(const file of evidence){const payload=new FormData();payload.append('file',file);const response=await fetch('/api/complaints/evidence',{method:'POST',body:payload,credentials:'include'});const json=await response.json();if(!response.ok)throw new Error(json.error);uploaded.push(json.data)}
      const response=await fetch('/api/complaints',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({categoryId:selectedCategory.id,description:form.description,evidenceUrls:uploaded.map(file=>file.id),evidenceNames:uploaded.map(file=>file.name)})})
      const json=await response.json();if(!response.ok)throw new Error(json.error)
      const updated=await loadCases();const created=updated.find(item=>item.caseCode===json.data.caseCode)
      if(created){setSelectedId(created.id);setMode('chat')}
      setForm({description:''});setEvidence([]);setNotice('Yêu cầu đã gửi. Nhân viên hỗ trợ sẽ phản hồi trong hội thoại này.')
    }catch(error){setNotice(error instanceof Error?error.message:'Không thể gửi yêu cầu.')}finally{setBusy(false)}
  }

  async function sendReply(event:FormEvent){event.preventDefault();if(!selected||!reply.trim())return;setBusy(true)
    try{const response=await fetch(`/api/complaints/${selected.id}/messages`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:reply})});const json=await response.json();if(!response.ok)throw new Error(json.error);setReply('');await loadMessages(selected.id);await loadCases()}
    catch(error){setNotice(error instanceof Error?error.message:'Không gửi được tin nhắn.')}finally{setBusy(false)}}

  async function cancelRequest(){if(!selected||!window.confirm('Bạn muốn hủy phản ánh này?'))return;setBusy(true);setNotice('');try{const response=await fetch(`/api/complaints/${selected.id}/cancel`,{method:'POST',credentials:'include'});const json=await response.json();if(!response.ok)throw new Error(json.error);await loadCases()}catch(error){setNotice(error instanceof Error?error.message:'Không thể hủy phản ánh.')}finally{setBusy(false)}}

  if(authLoading||!user)return <main className="container-viewport mx-auto max-w-3xl py-16 text-center">Đang chuyển đến đăng nhập…</main>
  const visibleCategories=categories.filter(category=>category.groupName===group&&category.name.toLocaleLowerCase('vi').includes(categorySearch.toLocaleLowerCase('vi')))
  return <main className="container-viewport mx-auto max-w-5xl space-y-6 py-8 sm:py-10">
    <header className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Trung tâm hỗ trợ</p><h1 className="mt-1 text-3xl font-bold">Bạn cần hỗ trợ gì?</h1><p className="mt-2 text-muted-foreground">Chọn loại vấn đề, gửi yêu cầu và tiếp tục trao đổi với nhân viên tại lịch sử hỗ trợ.</p></div><Button asChild variant="outline"><Link href="/client/account?tab=support">Thông tin tài khoản</Link></Button></header>
    {mode==='home'&&<><section className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row"><Input placeholder="Tìm vấn đề cần hỗ trợ" value={categorySearch} onChange={event=>setCategorySearch(event.target.value)}/><Button variant="outline" onClick={()=>{void loadCases().then(data=>{if(data[0]){setSelectedId(data[0].id);setMode('chat')}})}}>Lịch sử hỗ trợ ({cases.length})</Button></div>
      <div className="mt-5 flex gap-2 border-b"><button onClick={()=>setGroup('general')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold ${group==='general'?'border-orange-600 text-orange-700':'border-transparent text-muted-foreground'}`}>Vấn đề chung<Badge variant="secondary">{categories.filter(category=>category.groupName==='general').length}</Badge></button><button onClick={()=>setGroup('service')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold ${group==='service'?'border-orange-600 text-orange-700':'border-transparent text-muted-foreground'}`}>Theo dịch vụ<Badge variant="secondary">{categories.filter(category=>category.groupName==='service').length}</Badge></button></div>
      <ul className="mt-2 divide-y">{visibleCategories.map(category=><li key={category.id}><button className="flex w-full items-center justify-between gap-3 py-4 text-left hover:text-orange-700" onClick={()=>{setSelectedCategory(category);setMode('new')}}><span className="font-medium">{category.name}</span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground"/></button></li>)}</ul>
      {!visibleCategories.length&&<p className="py-8 text-center text-sm text-muted-foreground">Chưa có danh mục phù hợp.</p>}</section>
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Lịch sử hỗ trợ</h2><div className="mt-3 flex gap-2 border-b"><button onClick={()=>setHistoryTab('active')} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-semibold ${historyTab==='active'?'border-orange-600 text-orange-700':'border-transparent text-muted-foreground'}`}>Đang xử lý<Badge variant="secondary">{activeCases.length}</Badge></button><button onClick={()=>setHistoryTab('completed')} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-semibold ${historyTab==='completed'?'border-orange-600 text-orange-700':'border-transparent text-muted-foreground'}`}>Đã kết thúc<Badge variant="secondary">{completedCases.length}</Badge></button></div>{displayedCases.length?<ul className="mt-2 divide-y">{displayedCases.map(item=><li key={item.id}><button onClick={()=>{setSelectedId(item.id);setMode('chat')}} className="flex w-full items-center justify-between gap-4 py-3 text-left"><span className="min-w-0"><b className="block truncate">{item.categoryName} · {item.subject}</b><span className="text-xs text-muted-foreground">{item.caseCode} · {new Date(item.createdAt).toLocaleDateString('vi-VN')}</span></span><Badge variant={item.status==='resolved'?'secondary':'outline'} className="shrink-0">{labels[item.status]||item.status}</Badge></button></li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">{cases.length?'Không có hồ sơ trong mục này.':'Bạn chưa có yêu cầu hỗ trợ nào.'}</p>}</section></>}
    {mode==='new'&&selectedCategory&&<section className="rounded-2xl border bg-card p-5 shadow-sm"><button onClick={()=>setMode('home')} className="mb-4 inline-flex items-center gap-2 text-sm text-orange-700"><ArrowLeft className="h-4 w-4"/>Trung tâm hỗ trợ</button><p className="text-sm text-muted-foreground">{selectedCategory.name}</p><h2 className="mt-1 text-2xl font-bold">Mô tả vấn đề của bạn</h2><p className="mt-2 text-sm text-muted-foreground">Nhân viên hỗ trợ sẽ trả lời trong hội thoại này. Bạn có thể quay lại xem bất cứ lúc nào trong lịch sử hỗ trợ.</p><form onSubmit={createRequest} className="mt-5 space-y-4"><label className="block space-y-1 text-sm">Nội dung *<Textarea required minLength={10} maxLength={10000} rows={6} placeholder="Mô tả rõ vấn đề bạn gặp phải và mong muốn được hỗ trợ" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"><Paperclip className="h-4 w-4"/>Thêm hình ảnh hoặc tài liệu<input className="sr-only" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e=>{const chosen=Array.from(e.target.files||[]);const allowed=chosen.filter(file=>['application/pdf','image/jpeg','image/png'].includes(file.type)&&file.size<=10*1024*1024);if(allowed.length!==chosen.length)setNotice('Chỉ nhận PDF/JPG/PNG tối đa 10MB mỗi tệp.');setEvidence(current=>[...current,...allowed].slice(0,5));e.target.value=''}}/></label><ul>{evidence.map((file,index)=><li key={`${file.name}-${index}`} className="flex items-center justify-between py-1 text-sm"><span>{file.name} · {(file.size/1024/1024).toFixed(1)}MB</span><button type="button" onClick={()=>setEvidence(current=>current.filter((_,i)=>i!==index))}><X className="h-4 w-4"/></button></li>)}</ul><div className="flex justify-end"><Button disabled={busy}>{busy?'Đang gửi…':'Gửi yêu cầu hỗ trợ'}</Button></div></form></section>}
    {mode==='chat'&&selected&&<section className="overflow-hidden rounded-2xl border bg-card shadow-sm"><ComplaintStatusTracker status={selected.status} events={selected.events||[]} createdAt={selected.createdAt}/><header className="border-b p-4"><button onClick={()=>setMode('home')} className="mb-3 inline-flex items-center gap-2 text-sm text-orange-700"><ArrowLeft className="h-4 w-4"/>Lịch sử hỗ trợ</button><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{selected.categoryName} · {selected.caseCode}</p><div className="flex items-center gap-2"><Badge variant={selected.status==='resolved'?'secondary':['cancelled','rejected'].includes(selected.status)?'destructive':'outline'}>{labels[selected.status]||selected.status}</Badge>{!['resolved','rejected','cancelled'].includes(selected.status)&&<Button variant="outline" size="sm" disabled={busy} onClick={cancelRequest}><XCircle className="mr-1 h-4 w-4"/>Hủy phản ánh</Button>}</div></div></header><div className="max-h-[60vh] min-h-72 space-y-3 overflow-y-auto bg-slate-50 p-4 sm:p-6">{chatItems.map(item=><div key={item.id} className={`max-w-[88%] rounded-2xl p-3 shadow-sm sm:max-w-[75%] ${item.senderRole==='customer'?'ml-auto bg-orange-100':'bg-white'}`}><p className="mb-1 text-xs font-semibold text-slate-500">{item.senderRole==='admin'?'Hỗ trợ APECSPACE':item.senderName}</p><p className="whitespace-pre-wrap text-sm">{item.message}</p><ComplaintMessageAttachments ids={item.evidenceUrls} names={item.evidenceNames} endpoint="client"/><time className="mt-1 block text-right text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</time></div>)}{!chatItems.length&&<p className="text-sm text-muted-foreground">Đang tải hội thoại…</p>}</div>{['resolved','rejected','cancelled'].includes(selected.status)?<p className="border-t bg-muted p-4 text-center text-sm">Hồ sơ đã kết thúc. Hội thoại đã khóa.</p>:<form onSubmit={sendReply} className="flex items-end gap-2 border-t p-3 sm:p-4"><Textarea value={reply} onChange={e=>setReply(e.target.value)} rows={2} maxLength={4000} placeholder="Nhập tin nhắn cho nhân viên hỗ trợ…"/><Button disabled={busy||!reply.trim()} aria-label="Gửi tin nhắn"><Send className="h-4 w-4 sm:mr-2"/><span className="hidden sm:inline">Gửi</span></Button></form>}</section>}
    {mode==='chat'&&selected&&<div className="space-y-4">{selected.status==='cancelled'&&<p className="rounded-lg border bg-muted p-3 text-sm">Phản ánh đã kết thúc. Xem tiến trình để biết cập nhật cuối cùng.</p>}{selected.status==='rejected'&&<p className="rounded-lg border bg-muted p-3 text-sm">Phản ánh đã bị từ chối và hội thoại đã khóa.</p>}{selected.status==='resolved'&&<ComplaintRating caseId={selected.id} existingRating={selected.customerRating} existingFeedback={selected.customerFeedback} onRated={loadCases}/ >}{!['cancelled','resolved','rejected'].includes(selected.status)&&<ImageMessageComposer caseId={selected.id} role="customer" onSent={async()=>{await loadMessages(selected.id);await loadCases()}}/>}</div>}
    {notice&&<p role="status" className="rounded-lg border bg-muted p-4">{notice}</p>}
  </main>
}

export default function ComplaintPage() {
  return <Suspense fallback={<main className="container-viewport mx-auto max-w-5xl py-16 text-center">Đang tải trung tâm hỗ trợ…</main>}><ComplaintPageContent/></Suspense>
}
