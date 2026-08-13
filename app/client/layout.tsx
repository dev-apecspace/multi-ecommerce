import type React from "react"
import { Navbar } from "@/components/navbar"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Footer } from "@/components/footer"
import { ExperimentalModeModal } from "@/components/experimental-mode-modal"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <BottomNavigation />
      <ExperimentalModeModal />
    </div>
  )
}
