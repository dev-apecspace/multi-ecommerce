"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  Package,
  ShoppingBag,
  Wallet,
  User,
  MessageSquare,
  Star,
  Settings,
  LogOut,
  Download,
  ChevronDown,
  FileText,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const sellerLinks = [
  { href: "/seller", label: "Tổng quan", icon: LayoutGrid, restricted: false },
  {
    href: "/seller/products",
    label: "Sản phẩm của tôi",
    icon: Package,
    restricted: true,
    subItems: [
      { href: "/seller/products", label: "Danh sách sản phẩm" },
      { href: "/seller/products/create", label: "Thêm sản phẩm mới" },
    ],
  },
  { href: "/seller/orders", label: "Đơn hàng", icon: ShoppingBag, restricted: true },
  { href: "/seller/wallet", label: "Ví tiền & Doanh thu", icon: Wallet, restricted: true },
  { href: "/seller/withdraw", label: "Yêu cầu rút tiền", icon: Download, restricted: true },
  { href: "/seller/documents", label: "Tài liệu shop", icon: FileText, restricted: false },
  { href: "/seller/profile", label: "Hồ sơ shop", icon: User, restricted: false },
  { href: "/seller/chat", label: "Chat với khách", icon: MessageSquare, restricted: true },
  { href: "/seller/reviews", label: "Đánh giá shop", icon: Star, restricted: true },
  { href: "/seller/settings", label: "Cài đặt shop", icon: Settings, restricted: false },
]

export function SellerSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  
  const isPending = user?.status === 'pending' || user?.status === 'pending_approval'

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    )
  }

  return (
    <TooltipProvider>
      <aside className="w-64 bg-white dark:bg-slate-950 border-r border-border min-h-screen p-4 sticky top-0 hidden md:flex flex-col">
        <Link href="/" className="text-2xl font-bold text-orange-600 dark:text-orange-500 mb-2 block">
          Sàn TMĐT
        </Link>
        <div className="text-xs text-muted-foreground mb-6">Bảng điều khiển Seller</div>

        {isPending && (
          <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-300">
            ⏳ Chờ phê duyệt
          </div>
        )}

        <nav className="space-y-1 flex-1 overflow-y-auto">
          {sellerLinks.map((link) => {
            const Icon = link.icon
            const isActive =
              pathname === link.href || (link.href !== "/seller" && pathname.startsWith(link.href))
            const isExpanded = expandedItems.includes(link.href)
            const hasSubItems = link.subItems && link.subItems.length > 0
            const isRestricted = isPending && link.restricted

            return (
              <div key={link.href}>
                {isRestricted ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Button
                          disabled
                          variant="ghost"
                          className={cn(
                            "w-full justify-between gap-2 px-3 opacity-50 cursor-not-allowed",
                          )}
                        >
                          <span className="flex items-center gap-3 flex-1">
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">{link.label}</span>
                          </span>
                          <Lock className="h-3 w-3 flex-shrink-0 text-yellow-600" />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Yêu cầu hồ sơ được phê duyệt</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
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
                          isActive && "bg-orange-50 dark:bg-slate-800 text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800",
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
                )}

                {hasSubItems && isExpanded && !isRestricted && (
                  <div className="ml-4 space-y-1 border-l border-border pl-3 my-1">
                    {link.subItems.map((subItem) => (
                      <Link key={subItem.href} href={subItem.href}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 text-sm px-3",
                            pathname === subItem.href &&
                              "bg-orange-50 dark:bg-slate-800 text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800",
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
              <span className="text-sm">Quay lại cửa hàng</span>
            </Link>
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
