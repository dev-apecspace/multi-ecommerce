'use client'

import type React from "react"
import { SellerSidebar } from "@/components/seller-sidebar"
import { SellerTopBar } from "@/components/seller-topbar"
import { useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Footer } from "@/components/footer"
import { ExperimentalModeModal } from "@/components/experimental-mode-modal"

export default function SellerLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { refreshUser } = useAuth()
  const hasRefreshed = useRef(false)

  useEffect(() => {
    if (!hasRefreshed.current) {
      hasRefreshed.current = true
      refreshUser()
    }
  }, [])

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-background dark:bg-slate-950">
      <SellerTopBar />
      <div className="flex min-w-0 flex-1 overflow-hidden pt-16 md:pt-0">
        <SellerSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <main className="min-w-0 flex-1">{children}</main>
          <Footer compact />
        </div>
      </div>
      <ExperimentalModeModal />
    </div>
  )
}
