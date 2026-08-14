'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, FileText, Loader2 } from 'lucide-react'

type Document = { code: string; title: string; fileName: string; fileUrl: string; updatedAt: string }

export function LegalDocumentLink({ code, pendingText = 'Tài liệu đang được cập nhật.' }: { code: string; pendingText?: string }) {
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/legal-documents').then(r => r.json()).then(r => setDocument((r.data || []).find((item: Document) => item.code === code) || null)).catch(() => setDocument(null)).finally(() => setLoading(false)) }, [code])
  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải tài liệu...</div>
  if (!document) return <p className="text-sm text-muted-foreground">{pendingText}</p>
  const viewUrl = `/api/legal-documents/view/${encodeURIComponent(document.code)}`
  return <section className="rounded-lg border bg-slate-50 dark:bg-slate-900">
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
      <div className="min-w-0"><p className="font-medium">{document.fileName}</p><p className="mt-1 text-xs text-muted-foreground">Cập nhật {new Date(document.updatedAt).toLocaleDateString('vi-VN')}</p></div>
      </div>
      <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700">
        Xem tài liệu <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  </section>
}
