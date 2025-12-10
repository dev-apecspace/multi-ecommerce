"use client"

import Link from "next/link"
import { Heart, User, ShoppingCart, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"

interface MobileMenuProps {
  onClose: () => void
  onLogin: () => void
}

export function MobileMenu({ onClose, onLogin }: MobileMenuProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const categories = [
    { label: "Thời trang nam", href: "/client/category/thoi-trang-nam" },
    { label: "Thời trang nữ", href: "/client/category/thoi-trang-nu" },
    { label: "Điện thoại & Phụ kiện", href: "/client/category/dien-tu" },
    { label: "Điện máy", href: "/client/category/dien-may" },
    { label: "Nhà cửa & Đời sống", href: "/client/category/nha-cua-doi-song" },
    { label: "Mỹ phẩm & Làm đẹp", href: "/client/category/my-pham-lam-dep" },
    { label: "Mẹ & Bé", href: "/client/category/me-be" },
    { label: "Thể thao & Dã ngoại", href: "/client/category/the-thao-da-ngoai" },
  ]

  const handleLogout = async (): Promise<void> => {
    try {
      await logout()
    } finally {
      onClose()
      router.push("/auth/login")
    }
  }

  return (
    <div className="md:hidden bg-white dark:bg-slate-900 border-t border-border overflow-y-auto pb-20">
      <div className="space-y-4 p-4">
        {user ? (
          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 space-y-2">
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/client/profile" onClick={onClose}>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <User className="h-4 w-4" />
                  Hồ sơ của tôi
                </Button>
              </Link>
              <Link href="/client/orders" onClick={onClose}>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Đơn hàng
                </Button>
              </Link>
              <Link href="/client/settings" onClick={onClose}>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  Cài đặt
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="w-full justify-start gap-2 text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose()
                router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
              }}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <User className="h-5 w-5" />
              <span className="text-xs">Tài khoản</span>
            </Button>
          <Link href="/client/favorites" onClick={onClose} className="w-full">
            <Button variant="outline" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 w-full">
              <Heart className="h-5 w-5" />
              <span className="text-xs">Yêu thích</span>
            </Button>
          </Link>
          <Link href="/client/cart" onClick={onClose} className="w-full">
            <Button variant="outline" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 w-full">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs">Giỏ hàng</span>
            </Button>
          </Link>
            </div>
        )}

        <div className="border-t border-border pt-4">
          <div className="text-sm font-semibold mb-3">Danh mục</div>
          <div className="space-y-2">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                onClick={onClose}
                className="block p-2 rounded hover:bg-orange-50 dark:hover:bg-slate-800 text-sm"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <Link href="/seller" onClick={onClose} className="block text-sm font-semibold hover:text-orange-600 dark:hover:text-orange-500">
            Bán hàng cùng chúng tôi
          </Link>
          <Link href="/client/shop" onClick={onClose} className="block text-sm hover:text-orange-600 dark:hover:text-orange-500">
            Ghé shop
          </Link>
          <Link href="/client/help" onClick={onClose} className="block text-sm hover:text-orange-600 dark:hover:text-orange-500">
            Trợ giúp
          </Link>
        </div>
      </div>
    </div>
  )
}
