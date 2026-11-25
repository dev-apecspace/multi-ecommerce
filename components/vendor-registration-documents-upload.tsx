'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { FileText, Plus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type VendorRegistrationDocument = { name: string; url?: string; documentType: string; file: File; slotId?: string }

const REQUIRED_DOCUMENTS = [
  { slotId: 'business-license', title: 'Giấy phép kinh doanh' },
  { slotId: 'bank-account-proof', title: 'Chứng minh tài khoản ngân hàng chính chủ' },
]
const CONDITIONAL_DOCUMENT = { slotId: 'regulated-business-license', title: 'Giấy phép/chứng nhận ngành nghề kinh doanh có điều kiện' }

export function VendorRegistrationDocumentsUpload({
  documents,
  onChange,
  regulatedBusiness,
  disabled = false,
}: {
  documents: VendorRegistrationDocument[]
  onChange: (documents: VendorRegistrationDocument[]) => void
  regulatedBusiness: boolean
  disabled?: boolean
}) {
  const [customSlots, setCustomSlots] = useState<Array<{ slotId: string; title: string }>>([])
  const visibleDocuments = useMemo(() => [...REQUIRED_DOCUMENTS, ...(regulatedBusiness ? [CONDITIONAL_DOCUMENT] : [])], [regulatedBusiness])

  const setSlotFile = (slotId: string, title: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const nextDocument: VendorRegistrationDocument = { name: file.name, documentType: title, file, slotId }
    onChange([...documents.filter((document) => document.slotId !== slotId), nextDocument])
  }

  const addCustomSlot = () => setCustomSlots((slots) => [...slots, { slotId: `optional-${crypto.randomUUID()}`, title: '' }])
  const updateCustomTitle = (slotId: string, title: string) => {
    setCustomSlots((slots) => slots.map((slot) => slot.slotId === slotId ? { ...slot, title } : slot))
    onChange(documents.map((document) => document.slotId === slotId ? { ...document, documentType: title } : document))
  }
  const removeCustomSlot = (slotId: string) => {
    setCustomSlots((slots) => slots.filter((slot) => slot.slotId !== slotId))
    onChange(documents.filter((document) => document.slotId !== slotId))
  }

  return <div className="space-y-3">
    <div className="space-y-3">
      {visibleDocuments.map((slot) => {
        const uploaded = documents.find((document) => document.slotId === slot.slotId)
        return <div key={slot.slotId} className={`rounded-lg border p-4 ${uploaded ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><p className="text-sm font-semibold">{slot.title}<span className="ml-1 text-destructive">*</span></p><p className="text-xs text-muted-foreground">Tên tài liệu đã điền sẵn, chỉ cần chọn tệp.</p></div>
            <label className="inline-flex cursor-pointer items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"><Upload className="mr-2 h-4 w-4" />{uploaded ? 'Đổi tệp' : 'Chọn tệp'}<input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="sr-only" disabled={disabled} onChange={(event) => setSlotFile(slot.slotId, slot.title, event)} /></label>
          </div>
          {uploaded && <p className="mt-3 flex items-center gap-2 text-xs text-emerald-800"><FileText className="h-4 w-4 shrink-0" /><span className="font-semibold">{slot.title}</span><span className="truncate text-emerald-700/80">· {uploaded.name}</span></p>}
        </div>
      })}
    </div>

    {customSlots.length > 0 && <div className="space-y-3 border-t pt-3"><p className="text-sm font-semibold">Tài liệu bổ sung</p>{customSlots.map((slot) => {
      const uploaded = documents.find((document) => document.slotId === slot.slotId)
      return <div key={slot.slotId} className="rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm font-medium">Tên tài liệu<Input className="mt-1" value={slot.title} onChange={(event) => updateCustomTitle(slot.slotId, event.target.value)} placeholder="Nhập tên tài liệu" disabled={disabled} /></label>
          <label className="inline-flex cursor-pointer items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"><Upload className="mr-2 h-4 w-4" />{uploaded ? 'Đổi tệp' : 'Chọn tệp'}<input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="sr-only" disabled={disabled || !slot.title.trim()} onChange={(event) => setSlotFile(slot.slotId, slot.title.trim(), event)} /></label>
          <Button type="button" variant="ghost" size="icon" aria-label="Xóa tài liệu bổ sung" disabled={disabled} onClick={() => removeCustomSlot(slot.slotId)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
        {uploaded && <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><FileText className="h-4 w-4 shrink-0" /><span className="font-medium">{slot.title || 'Tài liệu bổ sung'}</span><span className="truncate">· {uploaded.name}</span></p>}
      </div>
    })}</div>}

    <Button type="button" variant="outline" onClick={addCustomSlot} disabled={disabled}><Plus className="mr-2 h-4 w-4" />Thêm tài liệu</Button>
    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, JPG hoặc PNG · tối đa 10MB mỗi tệp.</p>
  </div>
}
