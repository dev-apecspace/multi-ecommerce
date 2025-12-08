"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  Store,
  Package,
  ShoppingBag,
  Layers,
  Download,
  Settings,
  LogOut,
  Users,
  Tag,
  Image,
  TrendingUp,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const adminLinks = [
  { href: "/admin", label: "Tổng quan sàn", icon: LayoutGrid },
  { href: "/admin/vendors", label: "Quản lý Vendor", icon: Store },
  { href: "/admin/products", label: "Quản lý sản phẩm", icon: Package },
  { href: "/admin/orders", label: "Quản lý đơn hàng", icon: ShoppingBag },
  { href: "/admin/categories", label: "Quản lý danh mục", icon: Layers },
  { href: "/admin/withdraw-requests", label: "Quản lý yêu cầu rút tiền", icon: Download },
  {
    href: "/admin/promotions",
    label: "Quản lý khuyến mãi & Flash Sale",
    icon: Tag,
  },
  { href: "/admin/users", label: "Người dùng khách hàng", icon: Users },
  { href: "/admin/settings", label: "Cài đặt hệ thống", icon: Settings },
  { href: "/admin/banners", label: "Banner & Quảng cáo", icon: Image },
  { href: "/admin/reports", label: "Báo cáo & Thống kê", icon: TrendingUp },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    )
  }

  return (
    <aside className="w-64 bg-white dark:bg-slate-950 border-r border-border min-h-screen p-4 sticky top-0 hidden md:flex flex-col">
      <Link href="/" className="text-2xl font-bold text-orange-600 dark:text-orange-500 mb-2 block">
        Sàn TMĐT
      </Link>
      <div className="text-xs text-muted-foreground mb-6">Admin Dashboard</div>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        {adminLinks.map((link) => {
          const Icon = link.icon
          const isActive =
            pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
          const isExpanded = expandedItems.includes(link.href)
          const hasSubItems = link.subItems && link.subItems.length > 0

          return (
            <div key={link.href}>
              <button
                onClick={() => hasSubItems && toggleExpanded(link.href)}
                className="w-full"
                asChild={!hasSubItems}
              >
                <Link href={link.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between gap-2 px-3",
                      isActive && "bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800",
                    )}
                  >
                    <span className="flex items-center gap-3 flex-1">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{link.label}</span>
                    </span>
                    {hasSubItems && (
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                    )}
                  </Button>
                </Link>
              </button>

              {hasSubItems && isExpanded && (
                <div className="ml-4 space-y-1 border-l border-border pl-3 my-1">
                  {link.subItems.map((subItem) => (
                    <Link key={subItem.href} href={subItem.href}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-2 text-sm px-3",
                          pathname === subItem.href &&
                            "bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800",
                        )}
                      >
                        {subItem.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="space-y-2 border-t border-border pt-4">
        <Button variant="outline" className="w-full justify-start gap-3 bg-transparent" asChild>
          <Link href="/">
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Đăng xuất</span>
          </Link>
        </Button>
      </div>
    </aside>
  )
}
