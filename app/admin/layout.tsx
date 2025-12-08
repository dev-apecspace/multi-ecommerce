import type React from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminTopBar } from "@/components/admin-topbar"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-slate-950">
      <AdminTopBar />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
