'use client'

import { FormEvent, useState } from 'react'
import { ImagePlus, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Uploaded = { id: string; name: string }

export function ImageMessageComposer({ caseId, role, onSent }: { caseId: number; role: 'customer' | 'admin'; onSent: () => Promise<void> | void }) {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!files.length) return
    setBusy(true); setError('')
    try {
      const uploaded: Uploaded[] = []
      for (const file of files) {
        const payload = new FormData(); payload.append('file', file)
        const response = await fetch('/api/complaints/evidence', { method: 'POST', body: payload, credentials: 'include' })
        const json = await response.json(); if (!response.ok) throw new Error(json.error)
        uploaded.push(json.data)
      }
      const text = role === 'admin' ? 'Admin gửi hình ảnh đính kèm.' : 'Khách hàng gửi hình ảnh đính kèm.'
      const response = await fetch(`/api/complaints/${caseId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ message: text, evidenceUrls: uploaded.map(file => file.id), evidenceNames: uploaded.map(file => file.name) }) })
      const json = await response.json(); if (!response.ok) throw new Error(json.error)
      setFiles([]); await onSent()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không gửi được hình ảnh.') }
    finally { setBusy(false) }
  }

  return <form onSubmit={submit} className="mt-2 rounded-lg border border-dashed p-3">
    <div className="flex flex-wrap items-center gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"><ImagePlus className="h-4 w-4"/>Thêm hình ảnh<input className="sr-only" type="file" multiple accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={event=>{const chosen=Array.from(event.target.files||[]);const accepted=chosen.filter(file=>['image/jpeg','image/png'].includes(file.type)&&file.size<=10*1024*1024);if(accepted.length!==chosen.length)setError('Chỉ nhận JPG/PNG, tối đa 10MB mỗi ảnh.');setFiles(current=>[...current,...accepted].slice(0,5));event.target.value=''}}/></label>{files.length>0&&<Button size="sm" disabled={busy}>{busy?'Đang gửi…':<><Send className="mr-1 h-3.5 w-3.5"/>Gửi ảnh ({files.length})</>}</Button>}</div>
    {files.length>0&&<ul className="mt-2 flex flex-wrap gap-2">{files.map((file,index)=><li key={`${file.name}-${index}`} className="flex max-w-full items-center gap-2 rounded bg-muted px-2 py-1 text-xs"><span className="max-w-56 truncate">{file.name}</span><button type="button" aria-label={`Bỏ ${file.name}`} onClick={()=>setFiles(current=>current.filter((_,i)=>i!==index))}><X className="h-3.5 w-3.5"/></button></li>)}</ul>}
    {error&&<p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    <p className="mt-2 text-xs text-muted-foreground">JPG hoặc PNG · tối đa 5 ảnh, mỗi ảnh 10MB.</p>
  </form>
}
