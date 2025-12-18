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
  Percent,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface SubItem {
  href: string
  label: string
}

interface AdminLink {
  href: string
  label: string
  icon: any
  subItems?: SubItem[]
}

const adminLinks: AdminLink[] = [
  { href: "/admin", label: "Tổng quan sàn", icon: LayoutGrid },
  { href: "/admin/products", label: "Quản lý sản phẩm", icon: Package },
  { href: "/admin/categories", label: "Quản lý danh mục", icon: Layers },
  { href: "/admin/vendors", label: "Quản lý nhà cung cấp", icon: Store },
  { href: "/admin/orders", label: "Quản lý đơn hàng", icon: ShoppingBag },
  {
    href: "/admin/promotions",
    label: "Quản lý khuyến mãi & Flash Sale",
    icon: Tag,
  },
  { href: "/admin/vouchers", label: "Quản lý Voucher", icon: Percent },
  { href: "/admin/users", label: "Người dùng khách hàng", icon: Users },
  { href: "/admin/banners", label: "Banner & Quảng cáo", icon: Image },
  // { href: "/admin/withdraw-requests", label: "Quản lý yêu cầu rút tiền", icon: Download },
  { href: "/admin/reports", label: "Báo cáo & Thống kê", icon: TrendingUp },
  { href: "/admin/settings", label: "Cài đặt hệ thống", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    )
  }

  return (
    <>
      <aside className="w-64 bg-white dark:bg-slate-950 border-r border-border min-h-screen p-4 sticky top-0 hidden md:flex flex-col">
      <Link href="/" className="text-2xl font-bold text-orange-600 dark:text-orange-500 mb-2 block">
        Sàn TMĐT APECSPACE
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

    <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-slate-950 border-b border-border p-4 flex items-center justify-between h-16">
      <Link href="/" className="text-lg font-bold text-orange-600 dark:text-orange-500">
        APECSPACE
      </Link>
      <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 hover:bg-muted rounded">
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </div>

    {mobileOpen && (
      <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-white dark:bg-slate-950 z-20 overflow-y-auto">
        <nav className="space-y-1 p-4">
          {adminLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
            const isExpanded = expandedItems.includes(link.href)
            const hasSubItems = link.subItems && link.subItems.length > 0

            return (
              <div key={link.href}>
                <button
                  onClick={() => {
                    hasSubItems && toggleExpanded(link.href)
                    !hasSubItems && setMobileOpen(false)
                  }}
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
                      <Link key={subItem.href} href={subItem.href} onClick={() => setMobileOpen(false)}>
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
        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full justify-start gap-3 bg-transparent" asChild>
            <Link href="/">
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Đăng xuất</span>
            </Link>
          </Button>
        </div>
      </div>
    )}
    </>
  )
}
