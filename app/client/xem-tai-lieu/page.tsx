"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { FileWarning } from "lucide-react"

function DocumentViewerContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get("url")
  const name = searchParams.get("name") || "Tài liệu"

  if (!url) {
    return <main className="grid min-h-screen place-items-center p-6 text-center"><div><FileWarning className="mx-auto h-10 w-10 text-muted-foreground" /><h1 className="mt-4 text-xl font-semibold">Không tìm thấy tài liệu</h1></div></main>
  }

  return (
    <main className="flex h-screen flex-col bg-slate-100">
      <header className="border-b bg-white px-4 py-3 sm:px-6">
        <h1 className="truncate font-semibold text-slate-900">{name}</h1>
      </header>
      <iframe title={`Xem ${name}`} src={url} className="min-h-0 flex-1 border-0" />
    </main>
  )
}

export default function DocumentViewerPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center p-6 text-muted-foreground">Đang tải tài liệu...</main>}>
      <DocumentViewerContent />
    </Suspense>
  )
}
