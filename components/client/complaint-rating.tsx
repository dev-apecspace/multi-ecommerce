'use client'

import { FormEvent, useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function ComplaintRating({ caseId, existingRating, existingFeedback, onRated }: { caseId: number; existingRating?: number; existingFeedback?: string; onRated: () => Promise<unknown> | void }) {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!rating) return
    setSaving(true); setError('')
    try { const response=await fetch(`/api/complaints/${caseId}/rating`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({rating,feedback})});const json=await response.json();if(!response.ok)throw new Error(json.error);await onRated() }
    catch(cause){setError(cause instanceof Error?cause.message:'Không lưu được đánh giá.')}finally{setSaving(false)}
  }
  if (existingRating) return <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold">Cảm ơn bạn đã đánh giá {existingRating}/5 sao.</p>{existingFeedback&&<p className="mt-1 text-sm">{existingFeedback}</p>}</div>
  return <form onSubmit={submit} className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><div><h3 className="font-semibold">Đánh giá hỗ trợ</h3><p className="text-sm text-muted-foreground">Yêu cầu đã được giải quyết. Trải nghiệm hỗ trợ của bạn thế nào?</p></div><div className="flex gap-1" role="radiogroup" aria-label="Đánh giá từ 1 đến 5 sao">{[1,2,3,4,5].map(value=><button key={value} type="button" role="radio" aria-checked={rating===value} aria-label={`${value} sao`} onClick={()=>setRating(value)}><Star className={`h-7 w-7 ${rating>=value?'fill-amber-400 text-amber-500':'text-slate-300'}`}/></button>)}</div><Textarea value={feedback} onChange={event=>setFeedback(event.target.value)} maxLength={2000} rows={2} placeholder="Chia sẻ thêm (không bắt buộc)"/>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={!rating||saving}>{saving?'Đang gửi…':'Gửi đánh giá'}</Button></form>
}
