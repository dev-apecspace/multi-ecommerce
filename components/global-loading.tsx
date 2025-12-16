'use client'

import { useLoading } from '@/lib/loading-context'
import { Loader2 } from 'lucide-react'

export function GlobalLoading() {
  const { isLoading } = useLoading()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-lg">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm font-medium text-gray-700">Loading...</p>
      </div>
    </div>
  )
}
