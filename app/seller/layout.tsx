'use client'

import type React from "react"
import { SellerSidebar } from "@/components/seller-sidebar"
import { SellerTopBar } from "@/components/seller-topbar"
import { useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"

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
    <div className="flex flex-col min-h-screen bg-background dark:bg-slate-950">
      <SellerTopBar />
      <div className="flex flex-1 overflow-hidden pt-16 md:pt-0">
        <SellerSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
