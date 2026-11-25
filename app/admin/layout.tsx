import type React from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminTopBar } from "@/components/admin-topbar"
import { ExperimentalModeModal } from "@/components/experimental-mode-modal"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background dark:bg-slate-950">
      <AdminTopBar />
      <div className="flex min-h-0 flex-1 overflow-hidden pt-16 md:pt-0">
        <AdminSidebar />
        <main className="min-h-0 flex-1 overflow-y-auto md:ml-64">{children}</main>
      </div>
      <ExperimentalModeModal />
    </div>
  )
}
