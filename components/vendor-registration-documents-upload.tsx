'use client'

import { ChangeEvent, useRef, useState } from 'react'
import { FileText, Plus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type VendorRegistrationDocument = { name: string; url?: string; documentType: string; file: File }

export function VendorRegistrationDocumentsUpload({
  documents,
  onChange,
  disabled = false,
}: {
  documents: VendorRegistrationDocument[]
  onChange: (documents: VendorRegistrationDocument[]) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [documentType, setDocumentType] = useState('')
  const [error, setError] = useState('')

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!documentType.trim()) { setError('Vui lòng nhập tên tài liệu trước khi tải tệp.'); return }
    setError('')
    onChange([...documents, { name: file.name, documentType: documentType.trim(), file }])
    setDocumentType('')
  }

  return (
    <div className="space-y-3">
      {documents.length > 0 && (
        <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-semibold text-emerald-900">Hồ sơ đã ghi nhận ({documents.length})</p>
          {documents.map((document, index) => (
            <div key={`${document.name}-${index}`} className="flex items-center gap-3 rounded-md bg-white p-3">
              <FileText className="h-5 w-5 shrink-0 text-emerald-600" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{document.documentType}</p><p className="truncate text-xs text-muted-foreground">{document.name}</p><p className="mt-0.5 text-xs font-medium text-amber-700">Sẽ tải lên khi gửi đăng ký</p></div>
              <Button type="button" variant="ghost" size="icon" onClick={() => onChange(documents.filter((_, itemIndex) => itemIndex !== index))} disabled={disabled} aria-label={`Xóa ${document.name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <label className="mb-2 block text-sm font-medium">Tên tài liệu *</label>
        <Input value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="Ví dụ: Giấy phép kinh doanh" disabled={disabled} />
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={selectFile} className="sr-only" disabled={disabled} />
        <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => inputRef.current?.click()} disabled={disabled}>
          <Upload className="mr-2 h-4 w-4" /> Chọn hồ sơ
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">PDF, DOC, DOCX, JPG hoặc PNG · tối đa 10MB · chỉ tải lên khi gửi đăng ký</p>
        {error && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{error}</p>}
      </div>
      {documents.length === 0 && <p className="text-xs font-medium text-destructive">Cần tải lên ít nhất một hồ sơ.</p>}
    </div>
  )
}
