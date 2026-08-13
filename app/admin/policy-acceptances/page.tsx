"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BadgeCheck,
  CreditCard,
  FileCheck2,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

type Acceptance = {
  id: number
  policyCode: string
  policyTitle: string
  documentName?: string | null
  documentVersion?: string | null
  acceptedAt: string
  User?: { name?: string | null; email?: string | null } | null
}

const policyMeta = {
  "intermediary-payment-agreement": {
    label: "Hợp đồng trung gian",
    icon: CreditCard,
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  "website-operating-conditions": {
    label: "Điều kiện hoạt động",
    icon: ShieldCheck,
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  "terms-of-service": {
    label: "Điều khoản sử dụng",
    icon: FileText,
    className: "border-violet-200 bg-violet-50 text-violet-800",
  },
  "privacy-policy": {
    label: "Chính sách bảo mật",
    icon: ShieldCheck,
    className: "border-teal-200 bg-teal-50 text-teal-800",
  },
} as const

function PolicyBadge({ acceptance }: { acceptance: Acceptance }) {
  const meta = policyMeta[acceptance.policyCode as keyof typeof policyMeta]
  const Icon = meta?.icon ?? FileText

  return (
    <Badge variant="outline" className={`gap-1.5 font-medium ${meta?.className ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta?.label ?? acceptance.policyTitle}
    </Badge>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
}

export default function PolicyAcceptancesPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Acceptance[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [policyCode, setPolicyCode] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: "100" })
      if (policyCode) params.set("policyCode", policyCode)
      const response = await fetch(`/api/admin/policy-acceptances?${params}`, { credentials: "include" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Không thể tải lịch sử xác nhận.")
      setItems(result.data || [])
    } catch (error) {
      toast({
        title: "Không thể tải dữ liệu",
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [policyCode])

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return items
    return items.filter((item) =>
      [item.User?.name, item.User?.email, item.policyTitle, item.documentName]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    )
  }, [items, search])

  const uniqueUsers = new Set(items.map((item) => item.User?.email || item.User?.name).filter(Boolean)).size
  const walletCount = items.filter((item) => item.policyCode === "intermediary-payment-agreement").length

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-semibold tracking-wide text-orange-600">NHẬT KÝ TUÂN THỦ</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Lịch sử chấp nhận chính sách</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Theo dõi các lần khách hàng xác nhận chính sách trong quá trình thanh toán.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
          Làm mới
        </Button>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-3" aria-label="Tổng quan nhật ký">
        <div className="rounded-lg border bg-gradient-to-br from-orange-50 to-background p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Sự kiện đã ghi nhận</span><FileCheck2 className="h-4 w-4 text-orange-600" /></div>
          <p className="mt-2 text-2xl font-bold tabular-nums">{items.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Theo bộ lọc chính sách hiện tại</p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Khách hàng xác nhận</span><Users className="h-4 w-4 text-slate-600" /></div>
          <p className="mt-2 text-2xl font-bold tabular-nums">{uniqueUsers}</p>
          <p className="mt-1 text-xs text-muted-foreground">Người dùng không trùng lặp</p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Hợp đồng trung gian</span><CreditCard className="h-4 w-4 text-blue-600" /></div>
          <p className="mt-2 text-2xl font-bold tabular-nums">{walletCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Xác nhận thanh toán ví điện tử</p>
        </div>
      </section>

      <Card>
        <CardHeader className="gap-4 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-orange-600" />Lần chấp nhận đã ghi nhận</CardTitle>
            <CardDescription className="mt-1">Mỗi bản ghi lưu lại người dùng, tài liệu áp dụng và thời điểm xác nhận.</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <select value={policyCode} onChange={(event) => setPolicyCode(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">Tất cả chính sách</option>
              <option value="intermediary-payment-agreement">Hợp đồng trung gian</option>
              <option value="website-operating-conditions">Điều kiện hoạt động</option>
              <option value="terms-of-service">Điều khoản sử dụng</option>
              <option value="privacy-policy">Chính sách bảo mật</option>
            </select>
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên hoặc email" className="pl-9" /></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            : visibleItems.length === 0 ? <div className="py-16 text-center"><FileCheck2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" /><p className="font-medium">Chưa có lịch sử xác nhận</p><p className="mt-1 text-sm text-muted-foreground">Dữ liệu sẽ xuất hiện khi khách hàng xác nhận chính sách ở trang thanh toán.</p></div>
            : <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm"><thead className="border-b bg-muted/50 text-left text-muted-foreground"><tr><th className="p-4 font-medium">Người dùng</th><th className="p-4 font-medium">Chính sách</th><th className="p-4 font-medium">Tài liệu / phiên bản</th><th className="p-4 font-medium">Trạng thái</th><th className="p-4 font-medium">Thời điểm</th></tr></thead>
                  <tbody>{visibleItems.map((item) => <tr key={item.id} className="border-b align-top transition-colors hover:bg-orange-50/30"><td className="p-4"><p className="font-medium">{item.User?.name || "Người dùng không xác định"}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.User?.email || "—"}</p></td><td className="p-4"><PolicyBadge acceptance={item} /><p className="mt-1.5 text-xs text-muted-foreground">{item.policyTitle}</p></td><td className="p-4"><p className="max-w-[250px] break-words font-medium">{item.documentName || "Chưa có tệp đính kèm"}</p>{item.documentVersion && <p className="mt-1 text-xs text-muted-foreground">Cập nhật {formatDate(item.documentVersion)}</p>}</td><td className="p-4"><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700"><BadgeCheck />Đã xác nhận</Badge></td><td className="p-4 whitespace-nowrap text-muted-foreground">{formatDate(item.acceptedAt)}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="divide-y md:hidden">
                {visibleItems.map((item) => <article key={item.id} className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.User?.name || "Người dùng không xác định"}</p><p className="mt-0.5 break-all text-xs text-muted-foreground">{item.User?.email || "—"}</p></div><Badge variant="outline" className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700"><BadgeCheck />Đã xác nhận</Badge></div><PolicyBadge acceptance={item} /><div className="rounded-md bg-muted/50 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tài liệu áp dụng</p><p className="mt-1 break-words text-sm font-medium">{item.documentName || "Chưa có tệp đính kèm"}</p>{item.documentVersion && <p className="mt-1 text-xs text-muted-foreground">Phiên bản: {formatDate(item.documentVersion)}</p>}</div><p className="text-xs text-muted-foreground">Xác nhận lúc <span className="font-medium text-foreground">{formatDate(item.acceptedAt)}</span></p></article>)}
              </div>
            </>}
        </CardContent>
      </Card>
    </main>
  )
}
