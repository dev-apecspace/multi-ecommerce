'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type CaseItem = { id: number; caseCode: string; categoryName: string; subject: string; status: string; createdAt: string }
const labels: Record<string, string> = { received: 'Đã tiếp nhận', reviewing: 'Đang xử lý', waiting_user: 'Chờ bạn phản hồi', waiting_staff: 'Đang chờ nhân viên hỗ trợ', resolved: 'Đã giải quyết', rejected: 'Đã đóng' }

export function ComplaintHistory() {
  const [items, setItems] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/complaints',{cache:'no-store'}).then(async response=>{const json=await response.json();if(response.ok)setItems(json.data||[])}).finally(()=>setLoading(false)) },[])
  return <section className="space-y-4"><header><h2 className="text-xl font-semibold">Phản ánh và yêu cầu hỗ trợ</h2><p className="text-sm text-muted-foreground">Hồ sơ và hội thoại hỗ trợ được lưu trong tài khoản của bạn.</p></header>{loading?<p className="text-sm text-muted-foreground">Đang tải lịch sử…</p>:items.length?<ul className="divide-y rounded-xl border">{items.map(item=><li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="text-xs text-muted-foreground">{item.caseCode} · {item.categoryName}</p><p className="font-medium">{item.subject}</p><p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-800">{labels[item.status]||item.status}</span><Button asChild size="sm" variant="outline"><Link href={`/client/khieu-nai?case=${item.id}`}>Mở hội thoại</Link></Button></div></li>)}</ul>:<div className="rounded-xl border p-6 text-center"><p className="text-muted-foreground">Bạn chưa có phản ánh nào.</p><Button asChild className="mt-3"><Link href="/client/khieu-nai">Mở Trung tâm hỗ trợ</Link></Button></div>}</section>
}
