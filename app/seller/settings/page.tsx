"use client"

import { Suspense } from "react"
import { Loader } from "lucide-react"
import SettingsContent from "./settings-content"

export default function SellerSettingsPage() {
  return (
    <Suspense fallback={
      <main className="p-6">
        <div className="flex items-center justify-center h-96">
          <Loader className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </main>
    }>
      <SettingsContent />
    </Suspense>
  )
}
