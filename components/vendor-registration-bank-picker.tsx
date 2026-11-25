'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Landmark, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type VietQrBank = { bin: string; code: string; shortName: string; name: string; logo?: string }

export function VendorRegistrationBankPicker({
  id,
  bankCode,
  bankBin,
  bankName,
  onChange,
  disabled = false,
}: {
  id: string
  bankCode: string
  bankBin: string
  bankName: string
  onChange: (bank: VietQrBank) => void
  disabled?: boolean
}) {
  const [banks, setBanks] = useState<VietQrBank[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/banks', { cache: 'force-cache' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Không thể tải danh sách ngân hàng.')
        if (mounted) setBanks(Array.isArray(result.data) ? result.data : [])
      })
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Không thể tải danh sách ngân hàng.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const selectedBank = banks.find((bank) => bank.bin === bankBin || bank.code === bankCode)
  const label = selectedBank ? `${selectedBank.shortName} — ${selectedBank.name}` : bankName || 'Chọn ngân hàng'
  const matchingBanks = useMemo(() => banks, [banks])

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled || loading} className="mt-2 h-12 w-full justify-between gap-2 px-3 text-left font-normal">
        <span className="flex min-w-0 items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : selectedBank?.logo ? <img src={selectedBank.logo} alt="" className="h-7 w-7 rounded border bg-white object-contain p-0.5" /> : <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <span className="truncate">{loading ? 'Đang tải danh sách ngân hàng...' : label}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[min(22rem,calc(100vw-2rem))] p-1">
      {error ? <div className="space-y-2 p-3 text-sm text-destructive"><p>{error}</p><Button type="button" size="sm" variant="outline" onClick={() => window.location.reload()}>Tải lại danh sách</Button></div> : <Command shouldFilter>
        <CommandInput placeholder="Tìm tên, mã hoặc BIN ngân hàng..." />
        <CommandList className="max-h-[min(19rem,calc(100dvh-11rem))]">
          <CommandEmpty>Không tìm thấy ngân hàng phù hợp.</CommandEmpty>
          <CommandGroup heading={`${matchingBanks.length} ngân hàng VietQR`}>
            {matchingBanks.map((bank) => <CommandItem key={bank.bin} value={`${bank.shortName} ${bank.name} ${bank.code} ${bank.bin}`} onSelect={() => { onChange(bank); setOpen(false) }} className="min-h-12 gap-2">
              <Check className={`h-4 w-4 shrink-0 ${bankBin === bank.bin || bankCode === bank.code ? 'text-orange-600 opacity-100' : 'opacity-0'}`} />
              {bank.logo ? <img src={bank.logo} alt="" className="h-7 w-7 shrink-0 rounded border bg-white object-contain p-0.5" /> : <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />}
              <span className="min-w-0"><span className="block truncate font-medium">{bank.shortName}</span><span className="block truncate text-xs text-muted-foreground">{bank.name}</span></span>
            </CommandItem>)}
          </CommandGroup>
        </CommandList>
      </Command>}
    </PopoverContent>
  </Popover>
}
