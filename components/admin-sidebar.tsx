'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  AlertTriangle, ChevronDown, FileCheck2, FileText, Image, KeyRound, LayoutGrid, LogOut,
  Layers, Menu, MessageSquareText, MessageSquareWarning, Package, Percent, Settings, ShoppingBag,
  Store, Tag, TrendingUp, Users, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { hasAccountPermission, requiredAccountPermission } from '@/lib/account-permissions'

type MenuLink = { href: string; label: string; icon: typeof LayoutGrid }
type MenuGroup = { id: string; label: string; links: MenuLink[] }

const overview: MenuLink = { href: '/admin', label: 'Tổng quan', icon: LayoutGrid }
const groups: MenuGroup[] = [
  { id: 'operations', label: 'Vận hành sàn', links: [
    { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag },
    { href: '/admin/products', label: 'Sản phẩm', icon: Package },
    { href: '/admin/categories', label: 'Danh mục', icon: Layers },
    { href: '/admin/vendors', label: 'Nhà bán hàng', icon: Store },
  ] },
  { id: 'growth', label: 'Tăng trưởng', links: [
    { href: '/admin/promotions', label: 'Khuyến mãi', icon: Tag },
    { href: '/admin/vouchers', label: 'Voucher', icon: Percent },
    { href: '/admin/banners', label: 'Banner & quảng cáo', icon: Image },
    { href: '/admin/reviews', label: 'Đánh giá', icon: MessageSquareText },
  ] },
  { id: 'people', label: 'Người dùng & hỗ trợ', links: [
    { href: '/admin/users', label: 'Người dùng', icon: Users },
    { href: '/admin/accounts', label: 'Tài khoản admin', icon: KeyRound },
    { href: '/admin/complaints', label: 'Phản ánh & khiếu nại', icon: MessageSquareWarning },
    { href: '/admin/social-organization-feedback', label: 'Phản ánh tổ chức xã hội', icon: MessageSquareText },
  ] },
  { id: 'compliance', label: 'Chính sách & tuân thủ', links: [
    { href: '/admin/legal-documents', label: 'Tài liệu chính sách', icon: FileText },
    { href: '/admin/policy-acceptances', label: 'Lịch sử xác nhận', icon: FileCheck2 },
    { href: '/admin/vendor-registration-warning', label: 'Cảnh báo nhà bán hàng', icon: AlertTriangle },
  ] },
  { id: 'finance', label: 'Tài chính', links: [
    { href: '/admin/vendor-monthly-fees', label: 'Phí hàng tháng', icon: Percent },
    { href: '/admin/transactions', label: 'Giao dịch', icon: TrendingUp },
    { href: '/admin/reports', label: 'Báo cáo & đối soát', icon: TrendingUp },
  ] },
  { id: 'system', label: 'Hệ thống', links: [
    { href: '/admin/settings', label: 'Cài đặt', icon: Settings },
  ] },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)

  const permitted = (link: MenuLink) => !Array.isArray(user?.permissions) || hasAccountPermission('admin', user.permissions, requiredAccountPermission('admin', link.href))
  const OverviewIcon = overview.icon
  const activeGroup = groups.find((group) => group.links.some((link) => pathname === link.href || pathname.startsWith(`${link.href}/`)))?.id

  useEffect(() => {
    if (activeGroup) setExpandedGroups([activeGroup])
  }, [activeGroup])

  const renderNavigation = (mobile = false) => <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
    {permitted(overview) && <Link href={overview.href} onClick={() => mobile && setMobileOpen(false)} className="block">
      <Button variant="ghost" className={cn('w-full justify-start gap-3 rounded-lg px-3', pathname === overview.href && 'bg-blue-50 font-semibold text-blue-700 hover:bg-blue-50')}><OverviewIcon className="h-4 w-4"/><span>{overview.label}</span></Button>
    </Link>}
    {groups.map((group) => {
      const links = group.links.filter(permitted)
      if (!links.length) return null
      const open = expandedGroups.includes(group.id)
      return <section key={group.id} className="pt-2">
        <button type="button" aria-expanded={open} onClick={() => setExpandedGroups((current) => open ? current.filter((id) => id !== group.id) : [...current, group.id])} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-800">
          <span>{group.label}</span><ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}/>
        </button>
        {open && <div className="space-y-0.5 pb-1">{links.map((link) => {
          const Icon = link.icon
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
          return <Link key={link.href} href={link.href} onClick={() => mobile && setMobileOpen(false)} className="block">
            <Button variant="ghost" className={cn('h-9 w-full justify-start gap-3 rounded-lg px-3 pl-5 text-sm text-slate-600', active && 'bg-blue-50 font-semibold text-blue-700 hover:bg-blue-50')}><Icon className="h-4 w-4 shrink-0"/><span className="truncate">{link.label}</span></Button>
          </Link>
        })}</div>}
      </section>
    })}
    <Link href="/auth/security" onClick={() => mobile && setMobileOpen(false)} className="block border-t border-slate-100 pt-2">
      <Button variant="ghost" className={cn('w-full justify-start gap-3 rounded-lg px-3 text-sm text-slate-600', pathname === '/auth/security' && 'bg-blue-50 font-semibold text-blue-700')}><KeyRound className="h-4 w-4"/><span>Đổi mật khẩu</span></Button>
    </Link>
  </nav>

  const brand = <Link href="/" className="flex items-center gap-2 px-4 py-4 text-lg font-bold tracking-tight text-orange-700"><span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-600 text-sm text-white">A</span><span>APECSPACE</span></Link>
  const logout = <Link href="/" className="block"><Button variant="ghost" className="w-full justify-start gap-3 rounded-lg px-4 text-sm text-slate-600"><LogOut className="h-4 w-4"/><span>Về trang chủ</span></Button></Link>

  return <>
    <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      {brand}<p className="px-5 pb-2 text-xs text-slate-500">Quản trị nền tảng</p>{renderNavigation()}<div className="border-t border-slate-100 p-3">{logout}</div>
    </aside>
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 md:hidden">
      {brand}<button type="button" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100">{mobileOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}</button>
    </header>
    {mobileOpen && <div className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-white md:hidden">{renderNavigation(true)}<div className="border-t border-slate-100 p-3">{logout}</div></div>}
  </>
}
