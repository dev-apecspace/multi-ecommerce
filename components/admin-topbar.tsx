"use client"

import Link from "next/link"
import { Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export function AdminTopBar() {
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
    <div className="h-16 bg-white dark:bg-slate-950 border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-xl font-bold text-orange-600 dark:text-orange-500">
          Sàn TMĐT APECSPACE
        </Link>
        <div className="text-sm text-muted-foreground">| Admin Panel</div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
