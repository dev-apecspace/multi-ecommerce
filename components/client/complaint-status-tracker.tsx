'use client'

import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type EventItem = { status: string; message: string; createdAt: string }
type ProgressStep = { status: string; createdAt?: string }
const labels: Record<string, string> = {
  received: 'Chờ tiếp nhận', accepted: 'Đã tiếp nhận', processing: 'Đang xử lý',
  resolved: 'Đã giải quyết', rejected: 'Từ chối', cancelled: 'Đã hủy',
}
const rank: Record<string, number> = { received: 0, accepted: 1, processing: 2, resolved: 3, rejected: 3 }
const timestamp = (value: string) => new Date(value).toLocaleString('vi-VN', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric', hour12: false,
})

function normalizeStatus(event: EventItem) {
  const message = event.message.toLocaleLowerCase('vi')
  if (message.includes('yêu cầu đã gửi') || message.includes('đã gửi phản ánh') || message.includes('đã gửi yêu cầu')) return 'received'
  if (message.includes('tiếp nhận')) return 'accepted'
  if (['reviewing', 'accepted'].includes(event.status)) return 'accepted'
  if (['waiting_user', 'waiting_staff', 'processing'].includes(event.status) || message.includes('đã phản hồi') || message.includes('đã trả lời')) return 'processing'
  if (event.status === 'closed' || event.status === 'cancelled') return 'cancelled'
  return event.status
}

export function ComplaintStatusTracker({ status, events, createdAt }: { status: string; events: EventItem[]; createdAt?: string }) {
  const progress = useMemo(() => {
    const history = [...events].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(event => ({ ...event, status: normalizeStatus(event) }))
    const eventTime = (step: string) => history.filter(event => event.status === step).at(-1)?.createdAt
    const normalizedCurrent = status === 'reviewing' ? 'accepted' : ['waiting_user', 'waiting_staff'].includes(status) ? 'processing' : status
    const terminal = ['resolved', 'rejected'].includes(normalizedCurrent) ? normalizedCurrent : undefined
    const historyRank = history.reduce((highest, event) => Math.max(highest, rank[event.status] ?? -1), 0)
    const currentRank = normalizedCurrent === 'cancelled' || normalizedCurrent === 'closed'
      ? Math.max(0, historyRank)
      : Math.max(rank[normalizedCurrent] ?? 0, historyRank)
    const outcome = terminal || 'resolved'
    const stages: ProgressStep[] = [
      { status: 'received', createdAt: eventTime('received') || createdAt },
      { status: 'accepted', createdAt: eventTime('accepted') || (currentRank >= 1 ? eventTime('processing') : undefined) },
      { status: 'processing', createdAt: eventTime('processing') },
      { status: outcome, createdAt: eventTime(outcome) },
    ]
    let lastTimestamp = 0
    const ordered = stages.map((step, index) => {
      if (index > currentRank) return { ...step, createdAt: undefined }
      const time = step.createdAt ? new Date(step.createdAt).getTime() : 0
      if (time && time < lastTimestamp) step.createdAt = new Date(lastTimestamp).toISOString()
      if (step.createdAt) lastTimestamp = new Date(step.createdAt).getTime()
      return step
    })
    return { steps: ordered, currentIndex: Math.min(currentRank, 3), terminal: !!terminal, currentLabel: labels[ordered[Math.min(currentRank, 3)].status] }
  }, [events, status, createdAt])

  return <section className="rounded-xl border bg-card p-4 sm:p-5" aria-label="Tiến trình xử lý phản ánh">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Tiến trình xử lý</h3><Badge variant={progress.terminal ? 'secondary' : 'outline'}>{progress.currentLabel}</Badge></div>
    <div className="mt-5 overflow-x-auto pb-2"><ol className="flex min-w-[640px] items-start">{progress.steps.map((step, index) => {
      const complete = progress.terminal || index < progress.currentIndex
      const current = !progress.terminal && index === progress.currentIndex
      const markerColor = complete ? 'border-emerald-600 bg-emerald-600 text-white' : current ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300 bg-slate-100 text-slate-400'
      const connectorColor = index < progress.currentIndex || progress.terminal ? 'bg-emerald-500' : 'bg-slate-200'
      const label = labels[step.status]
      return <li key={`${step.status}-${index}`} className="relative flex w-1/4 shrink-0 flex-col items-center px-2 text-center">
        {index > 0 && <span aria-hidden="true" className={`absolute left-0 right-1/2 top-[9px] h-0.5 ${connectorColor}`}/>}
        {index < progress.steps.length - 1 && <span aria-hidden="true" className={`absolute left-1/2 right-0 top-[9px] h-0.5 ${connectorColor}`}/>}
        <span aria-label={complete ? 'Hoàn tất' : current ? 'Đang thực hiện' : 'Chưa thực hiện'} className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 ${markerColor}`}>{complete&&<Check className="h-3 w-3"/>}</span>
        <span className={`mt-2 text-sm ${current||complete?'font-medium text-foreground':'text-muted-foreground'}`}>{label}</span>
        {step.createdAt&&<time className="mt-1 text-xs text-muted-foreground">{timestamp(step.createdAt)}</time>}
      </li>
    })}</ol></div>
  </section>
}
