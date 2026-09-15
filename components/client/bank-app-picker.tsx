"use client"

import { useEffect, useMemo, useState } from 'react'
import { Building2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface VietQrBank { bin: string; code: string; shortName: string; name: string }

interface BankAppPickerProps {
  orderId: number
  orderNumber: string
  amount: number
  recipientAccount: string | null | undefined
  recipientBankCode: string | null | undefined
}

export function BankAppPicker({ orderId, orderNumber, amount, recipientAccount, recipientBankCode }: BankAppPickerProps) {
  const [open, setOpen] = useState(false)
  const [banks, setBanks] = useState<VietQrBank[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasLoaded, setHasLoaded] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState('')

  useEffect(() => {
    if (!open || hasLoaded) return
    void (async () => {
      try {
        setHasLoaded(true); setLoading(true); setError('')
        const response = await fetch('/api/banks')
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Không thể tải danh sách ngân hàng.')
        setBanks(Array.isArray(result.data) ? result.data : [])
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Không thể tải danh sách ngân hàng.')
      } finally { setLoading(false) }
    })()
  }, [open, hasLoaded])

  const visibleBanks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return banks
    return banks.filter((bank) => `${bank.shortName} ${bank.name} ${bank.code}`.toLowerCase().includes(normalized))
  }, [banks, query])

  const openBankApp = (payerBank: VietQrBank) => {
    if (!recipientAccount || !recipientBankCode) return
    setDownloadStatus('Đang tải mã QR dự phòng...')
    void fetch(`/api/client/orders/${orderId}/payment-qr`)
      .then(async (response) => {
        if (!response.ok) throw new Error('QR download failed')
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `qr-${orderNumber}.png`
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(url)
        setDownloadStatus('Đã tải mã QR dự phòng.')
      })
      .catch(() => setDownloadStatus('Không thể tải QR tự động. Bạn vẫn có thể tải QR tại trang đơn hàng.'))
    const params = new URLSearchParams({
      app: payerBank.code.toLowerCase(),
      ba: `${recipientAccount}@${recipientBankCode}`,
      am: String(Math.round(amount)),
      tn: orderNumber,
      url: `${window.location.origin}/client/orders/${encodeURIComponent(orderNumber)}`,
    })
    const deeplink = `https://dl.vietqr.io/pay?${params.toString()}`
    console.info('[VietQR deeplink]', { deeplink, orderId, payerBankCode: payerBank.code })
    window.open(deeplink, '_blank', 'noopener,noreferrer')
  }

  if (!recipientAccount || !recipientBankCode) return null

  return <>
    <Button type="button" className="mt-3 w-full bg-blue-600 hover:bg-blue-700" onClick={() => setOpen(true)}><Building2 className="mr-2 h-4 w-4" />Thanh toán bằng ứng dụng ngân hàng</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto p-4 sm:max-w-md sm:p-6">
        <DialogHeader><DialogTitle>Chọn ứng dụng ngân hàng</DialogTitle><DialogDescription>Chọn ngân hàng bạn dùng để mở ứng dụng thanh toán. Người nhận là shop của đơn {orderNumber}.</DialogDescription></DialogHeader>
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Tìm tên hoặc mã ngân hàng" /></div>
        <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-1">
          {loading && <p className="p-4 text-center text-sm text-muted-foreground">Đang tải danh sách ngân hàng...</p>}
          {error && <p className="p-4 text-center text-sm text-destructive">{error}</p>}
          {downloadStatus && <p className="m-2 rounded-md bg-blue-50 px-3 py-2 text-center text-xs text-blue-700">{downloadStatus}</p>}
          {!loading && !error && visibleBanks.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy ngân hàng phù hợp.</p>}
          {visibleBanks.map((bank) => <button key={bank.bin} type="button" onClick={() => openBankApp(bank)} className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left hover:bg-white focus:bg-white focus:outline-none"><span className="min-w-0"><span className="block font-medium text-slate-900">{bank.shortName}</span><span className="block truncate text-xs text-muted-foreground">{bank.name}</span></span><span className="shrink-0 text-xs font-medium text-blue-600">Mở app</span></button>)}
        </div>
        <DialogFooter><Button className="w-full sm:w-auto" variant="outline" onClick={() => setOpen(false)}>Hủy</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>
}
