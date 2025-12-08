"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Grid, Zap, ShoppingCart, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: Home, label: "Trang chủ", href: "/" },
  { icon: Grid, label: "Danh mục", href: "/client/category/dien-tu" },
  { icon: Zap, label: "Flash Sale", href: "/client/cart" },
  { icon: ShoppingCart, label: "Giỏ hàng", href: "/client/cart" },
  { icon: User, label: "Tài khoản", href: "/client/account" },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-border z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center justify-center py-3 px-2 text-xs font-medium transition-colors",
                  isActive
                    ? "text-orange-600 dark:text-orange-500"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
