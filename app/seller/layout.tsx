'use client'

import type React from "react"
import { SellerSidebar } from "@/components/seller-sidebar"
import { SellerTopBar } from "@/components/seller-topbar"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Footer } from "@/components/footer"
import { ExperimentalModeModal } from "@/components/experimental-mode-modal"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

type SellerWarning = { title: string; content: string; version: number; minReadSeconds: number }

export default function SellerLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const hasRefreshed = useRef(false)
  const [warning, setWarning] = useState<SellerWarning | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [gateLoaded, setGateLoaded] = useState(false)
  const [gateError, setGateError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [readToEnd, setReadToEnd] = useState(false)
  const [commitChecked, setCommitChecked] = useState(false)
  const [savingAcceptance, setSavingAcceptance] = useState(false)
  const [rejectedShop, setRejectedShop] = useState(false)
  const customerApplyingForShop = !authLoading && user?.role === 'customer'

  useEffect(() => {
    if (!hasRefreshed.current) {
      hasRefreshed.current = true
      refreshUser()
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (user?.role !== 'vendor') {
      setGateLoaded(true)
      return
    }
    if (!user.vendorId) {
      setGateError('Không xác định được cửa hàng của tài khoản này. Vui lòng đăng nhập lại.')
      setGateLoaded(true)
      return
    }
    let active = true
    setGateLoaded(false)
    setGateError('')
    setRejectedShop(false)
    fetch('/api/seller/registration-state', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Không tải được trạng thái shop.')
        if (!active) return
        if (data.rejected) {
          setRejectedShop(true)
          setAccepted(false)
          return
        }
        const warningResponse = await fetch('/api/seller/vendor-warning-acceptance', { cache: 'no-store' })
        const warningData = await warningResponse.json()
        if (!warningResponse.ok) throw new Error(warningData.error || 'Không tải được cảnh báo nhà bán hàng.')
        if (!active) return
        setWarning(warningData.warning)
        setAccepted(Boolean(warningData.acceptance))
        setCountdown(warningData.warning.minReadSeconds)
        setReadToEnd(false)
        setCommitChecked(false)
      })
      .catch((error) => { if (active) setGateError(error instanceof Error ? error.message : 'Không tải được cảnh báo.') })
      .finally(() => { if (active) setGateLoaded(true) })
    return () => { active = false }
  }, [authLoading, user?.role, user?.vendorId])

  useEffect(() => {
    if (!warning || accepted || countdown <= 0) return
    const timer = window.setTimeout(() => setCountdown((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [warning, accepted, countdown])

  const acknowledgeWarning = async () => {
    if (!warning || !readToEnd || countdown > 0 || !commitChecked) return
    setSavingAcceptance(true)
    setGateError('')
    try {
      const response = await fetch('/api/seller/vendor-warning-acceptance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted: true, version: warning.version }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không lưu được xác nhận.')
      setAccepted(true)
    } catch (error) { setGateError(error instanceof Error ? error.message : 'Không lưu được xác nhận.') }
    finally { setSavingAcceptance(false) }
  }

  const isBlocked = authLoading || customerApplyingForShop || (user?.role === 'vendor' && (!gateLoaded || !accepted))
  const showWarningDialog = !authLoading && user?.role === 'vendor' && gateLoaded && !accepted && !rejectedShop

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-background dark:bg-slate-950">
      <div inert={isBlocked ? true : undefined}>
        {customerApplyingForShop ? <main>{children}</main> : <>
        <SellerTopBar />
        <div className="flex min-w-0 flex-1 overflow-hidden pt-16 md:pt-0">
          <SellerSidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            <main className="min-w-0 flex-1">{children}</main>
            <Footer compact />
          </div>
        </div>
        <ExperimentalModeModal />
        </>}
      </div>
      {customerApplyingForShop && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="customer-seller-title">
        <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700"><AlertTriangle className="h-6 w-6"/></div>
          <h1 id="customer-seller-title" className="text-xl font-bold text-slate-950">Đăng ký trở thành nhà bán hàng</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Bạn đang dùng tài khoản khách hàng. Hãy bổ sung hồ sơ cửa hàng để đăng ký bán hàng; thông tin cá nhân hiện tại sẽ được tự điền vào biểu mẫu.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => router.push('/auth/vendor-register?step=shop')}>Tiếp tục đăng ký shop</Button>
            <Button variant="outline" onClick={() => router.push('/client')}>Quay lại mua sắm</Button>
          </div>
        </section>
      </div>}
      {showWarningDialog && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="seller-warning-title">
        <section className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <header className="flex items-center gap-3 bg-red-700 px-5 py-4 text-white"><AlertTriangle className="h-6 w-6 shrink-0" /><div><h2 id="seller-warning-title" className="font-bold uppercase">{warning?.title || 'Cảnh báo quy định dành cho nhà bán hàng'}</h2><p className="text-xs text-red-100">Cần xác nhận để tiếp tục sử dụng khu vực nhà bán hàng</p></div></header>
          {authLoading || !gateLoaded ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Đang kiểm tra xác nhận...</div> : gateError && !warning ? <div className="space-y-4 p-6 text-sm"><p className="text-destructive">{gateError}</p><Button variant="outline" onClick={() => window.location.reload()}>Thử tải lại</Button></div> : warning && <>
            <div className="overflow-y-auto px-5 py-4 text-sm leading-6 text-slate-800" style={{ whiteSpace: 'pre-wrap' }} onScroll={(event) => { const element = event.currentTarget; if (element.scrollTop + element.clientHeight >= element.scrollHeight - 8) setReadToEnd(true) }}>{warning.content}</div>
            <footer className="space-y-3 border-t bg-white p-4">
              {gateError && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">{gateError}</p>}
              <p className={`rounded-md p-2 text-center text-xs font-semibold ${readToEnd && countdown === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{readToEnd && countdown === 0 ? 'Đã đọc hết nội dung cảnh báo.' : `Kéo đọc hết nội dung${countdown > 0 ? ` · vui lòng đọc ít nhất ${countdown} giây nữa` : ''}.`}</p>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={commitChecked} onChange={(event) => setCommitChecked(event.target.checked)} disabled={!readToEnd || countdown > 0 || savingAcceptance} className="mt-1 h-4 w-4" /><span>Tôi xác nhận đã đọc toàn bộ nội dung cảnh báo, hiểu rõ các chế tài xử lý và cam kết tuân thủ nghiêm ngặt.</span></label>
              <Button className="w-full bg-slate-900" disabled={!commitChecked || !readToEnd || countdown > 0 || savingAcceptance} onClick={() => void acknowledgeWarning()}>{savingAcceptance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}TÔI ĐÃ ĐỌC VÀ CAM KẾT TUÂN THỦ</Button>
            </footer>
          </>}
        </section>
      </div>}
      {rejectedShop && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-labelledby="rejected-shop-title">
        <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center gap-3 text-red-700"><AlertTriangle className="h-7 w-7"/><h2 id="rejected-shop-title" className="text-xl font-bold">Hồ sơ shop đã bị từ chối</h2></div>
          <p className="text-sm leading-6 text-slate-600">Shop này đã kết thúc quy trình xét duyệt và không thể thao tác trong khu vực nhà bán hàng. Bạn có thể đăng ký shop mới bằng chính tài khoản hiện tại.</p>
          <Button className="mt-6 w-full bg-orange-600 hover:bg-orange-700" onClick={() => router.push('/auth/vendor-register?step=shop&reapply=1')}>Đăng ký shop mới</Button>
        </section>
      </div>}
    </div>
  )
}
