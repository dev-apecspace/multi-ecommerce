'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ChevronDown, CreditCard, FileText, KeyRound, LayoutGrid, Lock, LogOut, Menu, MessageSquare,
  Package, Percent, RotateCcw, Settings, ShoppingBag, Tag, Users, Wallet, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UnreadBadge } from '@/components/chat/unread-badge'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import { useAuth } from '@/lib/auth-context'
import { hasAccountPermission, requiredAccountPermission } from '@/lib/account-permissions'
import { cn } from '@/lib/utils'

type MenuLink = { href: string; label: string; icon: typeof LayoutGrid; restricted?: boolean; unread?: boolean }
type MenuGroup = { id: string; label: string; links: MenuLink[] }

const overview: MenuLink = { href: '/seller', label: 'Tổng quan', icon: LayoutGrid }
const groups: MenuGroup[] = [
  { id: 'sales', label: 'Bán hàng', links: [
    { href: '/seller/products', label: 'Sản phẩm', icon: Package, restricted: true },
    { href: '/seller/orders', label: 'Đơn hàng', icon: ShoppingBag, restricted: true },
    { href: '/seller/returns', label: 'Trả hàng', icon: RotateCcw, restricted: true },
    { href: '/seller/customers', label: 'Khách hàng', icon: Users, restricted: true },
    { href: '/seller/chat', label: 'Tin nhắn', icon: MessageSquare, restricted: true, unread: true },
  ] },
  { id: 'growth', label: 'Khuyến mãi', links: [
    { href: '/seller/promotions', label: 'Chương trình khuyến mãi', icon: Tag, restricted: true },
    { href: '/seller/vouchers', label: 'Voucher', icon: Percent, restricted: true },
  ] },
  { id: 'finance', label: 'Tài chính', links: [
    { href: '/seller/transactions', label: 'Giao dịch & doanh thu', icon: CreditCard, restricted: true },
    { href: '/seller/monthly-fees', label: 'Phí hợp tác', icon: Wallet, restricted: true },
  ] },
  { id: 'shop', label: 'Quản lý shop', links: [
    { href: '/seller/accounts', label: 'Tài khoản nhân viên', icon: Users, restricted: true },
    { href: '/seller/documents', label: 'Hồ sơ shop', icon: FileText },
    { href: '/seller/legal-documents', label: 'Tài liệu chính sách', icon: FileText },
    { href: '/seller/settings', label: 'Thông tin & cài đặt', icon: Settings },
  ] },
]

export function SellerSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const unreadMessages = useUnreadMessages('seller', user?.role === 'vendor' ? user.id : null)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const isPending = user?.status === 'pending' || user?.status === 'pending_approval'

  const permitted = (link: MenuLink) => !Array.isArray(user?.permissions) || hasAccountPermission('seller', user.permissions, requiredAccountPermission('seller', link.href))
  const isActive = (link: MenuLink) => pathname === link.href || (link.href === '/seller' ? pathname === '/seller/dashboard' : pathname.startsWith(`${link.href}/`))
  const activeGroup = groups.find((group) => group.links.some((link) => isActive(link)))?.id

  useEffect(() => {
    if (activeGroup) setExpandedGroups([activeGroup])
  }, [activeGroup])

  const renderNavigation = (mobile = false) => <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
    {permitted(overview) && (isPending
      ? <Button disabled title="Shop đang chờ duyệt; hiện chỉ truy cập được Tài liệu shop" variant="ghost" className="w-full justify-start gap-3 rounded-lg px-3 opacity-50"><LayoutGrid className="h-4 w-4"/><span className="flex-1 text-left">{overview.label}</span><Lock className="h-3.5 w-3.5 text-amber-600"/></Button>
      : <Link href={overview.href} onClick={() => mobile && setMobileOpen(false)} className="block"><Button variant="ghost" className={cn('w-full justify-start gap-3 rounded-lg px-3', isActive(overview) && 'bg-orange-50 font-semibold text-orange-700 hover:bg-orange-50')}><LayoutGrid className="h-4 w-4"/><span>{overview.label}</span></Button></Link>)}
    {isPending && <p className="mx-3 my-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">Hồ sơ đang chờ duyệt</p>}
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
          const active = isActive(link)
          const disabled = isPending && link.href !== '/seller/documents'
          const content = <Button variant="ghost" disabled={disabled} className={cn('h-9 w-full justify-start gap-3 rounded-lg px-3 pl-5 text-sm text-slate-600', active && 'bg-orange-50 font-semibold text-orange-700 hover:bg-orange-50', disabled && 'cursor-not-allowed opacity-50')}><Icon className="h-4 w-4 shrink-0"/><span className="min-w-0 flex-1 truncate text-left">{link.label}</span>{link.unread && <UnreadBadge count={unreadMessages} />}{disabled && <Lock className="h-3.5 w-3.5 text-amber-600"/>}</Button>
          return disabled ? <div key={link.href} title={link.href === '/seller/pending-approval' ? 'Trạng thái xét duyệt hồ sơ' : 'Shop đang chờ duyệt; hiện chỉ truy cập được Tài liệu shop'}>{content}</div> : <Link key={link.href} href={link.href} onClick={() => mobile && setMobileOpen(false)} className="block">{content}</Link>
        })}</div>}
      </section>
    })}
    <Link href="/auth/security" onClick={() => mobile && setMobileOpen(false)} className="block border-t border-slate-100 pt-2">
      <Button variant="ghost" className={cn('w-full justify-start gap-3 rounded-lg px-3 text-sm text-slate-600', pathname === '/auth/security' && 'bg-orange-50 font-semibold text-orange-700')}><KeyRound className="h-4 w-4"/><span>Đổi mật khẩu</span></Button>
    </Link>
  </nav>

  const brand = <Link href="/" className="flex items-center gap-2 px-4 py-4 text-lg font-bold tracking-tight text-orange-700"><span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-600 text-sm text-white">A</span><span>APECSPACE</span></Link>
  const backToStore = <Link href="/" className="block"><Button variant="ghost" className="w-full justify-start gap-3 rounded-lg px-4 text-sm text-slate-600"><LogOut className="h-4 w-4"/><span>Về cửa hàng</span></Button></Link>

  return <>
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      {brand}<p className="px-5 pb-2 text-xs text-slate-500">Kênh bán hàng</p>{renderNavigation()}<div className="border-t border-slate-100 p-3">{backToStore}</div>
    </aside>
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 md:hidden">
      {brand}<button type="button" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100">{mobileOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}</button>
    </header>
    {mobileOpen && <div className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-white md:hidden">{renderNavigation(true)}<div className="border-t border-slate-100 p-3">{backToStore}</div></div>}
  </>
}
