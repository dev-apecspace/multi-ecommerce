"use client"

import Link from "next/link"
import { Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export function SellerTopBar() {
  const { logout, user } = useAuth()
  const router = useRouter()

  const handleLogout = async (): Promise<void> => {
    try {
      await logout()
    } finally {
      router.push("/auth/login")
    }
  }

  return (
    <div className="h-16 bg-white dark:bg-slate-950 border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <Link href="/seller" className="text-sm md:text-xl font-bold text-orange-600 dark:text-orange-500 truncate">
          Sàn TMĐT APECSPACE
        </Link>
        <div className="hidden md:block text-sm text-muted-foreground">| {user?.name || "Shop Name"}</div>
      </div>

      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10">
          <Bell className="h-4 md:h-5 w-4 md:w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
          <User className="h-4 md:h-5 w-4 md:w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 md:h-10 md:w-10">
          <LogOut className="h-4 md:h-5 w-4 md:w-5" />
        </Button>
      </div>
    </div>
  )
}
