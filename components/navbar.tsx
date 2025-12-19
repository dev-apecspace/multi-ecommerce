"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Search, User, Heart, Menu, X, ChevronDown, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileMenu } from "@/components/mobile-menu"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useFavoritesContext } from "@/lib/favorites-context"
import { generateSlug } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"

const categories = [
  { label: "Thời trang nam", href: "/client/category/thoi-trang-nam" },
  { label: "Thời trang nữ", href: "/client/category/thoi-trang-nu" },
  { label: "Điện thoại & Phụ kiện", href: "/client/category/dien-tu" },
  { label: "Điện máy", href: "/client/category/dien-may" },
  { label: "Nhà cửa & Đời sống", href: "/client/category/nha-cua-doi-song" },
  { label: "Mỹ phẩm & Làm đẹp", href: "/client/category/my-pham-lam-dep" },
  { label: "Mẹ & Bé", href: "/client/category/me-be" },
  { label: "Thể thao & Dã ngoại", href: "/client/category/the-thao-da-ngoai" },
  { label: "Sách & Văn phòng phẩm", href: "/client/category/sach-van-phong" },
  { label: "Ô tô – Xe máy", href: "/client/category/oto-xe-may" },
  { label: "Đồng hồ & Trang sức", href: "/client/category/dong-ho-trang-suc" },
  { label: "Giặt giũ & Chăm sóc nhà cửa", href: "/client/category/giat-giu-cham-soc" },
  { label: "Thực phẩm", href: "/client/category/thuc-pham" },
  { label: "Voucher & Dịch vụ", href: "/client/category/voucher-dich-vu" },
  { label: "Hàng quốc tế", href: "/client/category/hang-quoc-te" },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const { favoritesCount } = useFavoritesContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const desktopSearchContainerRef = useRef<HTMLDivElement>(null)
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isDesktopSearch = desktopSearchContainerRef.current && desktopSearchContainerRef.current.contains(target)
      const isMobileSearch = mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(target)
      
      if (!isDesktopSearch && !isMobileSearch) {
        setShowSearchDropdown(false)
      }
      
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    setShowSearchDropdown(false)
  }, [pathname])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=8`)
          if (res.ok) {
            const data = await res.json()
            setSearchResults(data.data || [])
          }
        } catch (error) {
          console.error("Failed to fetch search results", error)
        }
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <>
      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      <header className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-border shadow-sm">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs py-2">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
            <span>🎁 Chào mừng đến Sàn TMĐT APECSPACE - Mua sắm online giá rẻ</span>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/seller" className="hover:underline">
                Bán hàng cùng chúng tôi
              </Link>
              <Link href="/client/shop" className="hover:underline">
                Ghé shop
              </Link>
              <Link href="/client/help" className="hover:underline">
                Trợ giúp
              </Link>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/client" className="flex-shrink-0">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">Sàn TMĐT APECSPACE</div>
            </Link>

            {/* Search Bar - 50% width on desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl" ref={desktopSearchContainerRef}>
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm, shop..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSearchDropdown(!!e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      setShowSearchDropdown(false)
                      router.push(`/client/search?q=${encodeURIComponent(searchQuery)}`)
                    }
                  }}
                  onFocus={() => searchQuery && setShowSearchDropdown(true)}
                  className="w-full pl-10 pr-4 h-10"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />

                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-border rounded-lg shadow-lg z-[100] max-h-96 overflow-y-auto">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/client/product/${product.slug || generateSlug(product.name)}`}
                      >
                        <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer border-b border-border last:border-b-0 transition-colors">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={product.media?.[0]?.url || product.image || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                            <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold">
                              {(product.salePrice || product.price).toLocaleString("vi-VN")}₫
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-1">
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href="/client/favorites">
                  <Heart className="h-5 w-5" />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-bold">
                      {favoritesCount > 99 ? '99+' : favoritesCount}
                    </span>
                  )}
                </Link>
              </Button>

              {/* User Profile Dropdown */}
              <div ref={profileRef} className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => user ? setShowProfileDropdown(!showProfileDropdown) : router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)}
                >
                  <User className="h-5 w-5" />
                </Button>

                {user && showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-border rounded-lg shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="py-2">
                      <Link href="/client/account" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">
                        <User className="h-4 w-4" />
                        Hồ sơ của tôi
                      </Link>
                      <Link href="/client/order-history" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">
                        <ShoppingCart className="h-4 w-4" />
                        Đơn hàng của tôi
                      </Link>
                      <Link href="/client/account?tab=settings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">
                        <Settings className="h-4 w-4" />
                        Cài đặt
                      </Link>
                    </div>
                    <div className="border-t border-border py-2">
                      <button
                        onClick={async () => {
                          try {
                            await logout()
                          } finally {
                            setShowProfileDropdown(false)
                            router.push("/auth/login")
                          }
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800 text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href="/client/cart">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-bold">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-3" ref={mobileSearchContainerRef}>
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearchDropdown(!!e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setShowSearchDropdown(false)
                    router.push(`/client/search?q=${encodeURIComponent(searchQuery)}`)
                  }
                }}
                onFocus={() => searchQuery && setShowSearchDropdown(true)}
                className="w-full pl-10 h-10"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />

              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-border rounded-lg shadow-lg z-[100] max-h-96 overflow-y-auto">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/client/product/${product.slug || generateSlug(product.name)}`}
                    >
                      <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer border-b border-border last:border-b-0 transition-colors">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <Image
                            src={product.media?.[0]?.url || product.image || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                          <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold">
                            {(product.salePrice || product.price).toLocaleString("vi-VN")}₫
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mega Menu - Desktop Only */}
        <div className="hidden md:block border-t border-border">
          <div className="max-w-7xl mx-auto px-4 py-0 relative">
            <div
              className="w-fit"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <button className="flex items-center gap-2 py-3 text-sm font-medium hover:text-orange-600 dark:hover:text-orange-500">
                <Menu className="h-4 w-4" />
                Danh mục (15 ngành hàng)
                <ChevronDown className="h-4 w-4" />
              </button>

              {megaMenuOpen && (
                <div className="absolute left-0 right-0 top-full bg-white dark:bg-slate-950 border-t border-border shadow-lg z-50">
                  <div className="max-w-7xl mx-auto grid grid-cols-5 gap-2 p-4">
                    {categories.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        className="px-3 py-2 rounded hover:bg-orange-50 dark:hover:bg-slate-800 text-sm hover:text-orange-600 dark:hover:text-orange-500 transition-colors"
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-border px-4 py-3 bg-gray-50 dark:bg-slate-900">
                    <Link
                      href="/client/categories"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Xem tất cả danh mục →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <MobileMenu onClose={() => setMobileMenuOpen(false)} onLogin={() => setAuthModalOpen(true)} />
        )}
      </header>
    </>
  )
}
