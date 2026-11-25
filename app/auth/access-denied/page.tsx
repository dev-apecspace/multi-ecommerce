import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AccessDeniedPage() {
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-4"><section className="w-full max-w-md rounded-2xl border bg-white p-7 text-center shadow-sm"><ShieldAlert className="mx-auto h-10 w-10 text-amber-600"/><h1 className="mt-4 text-xl font-bold">Bạn chưa được cấp quyền</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Liên hệ quản trị tài khoản để được cấp quyền truy cập chức năng này.</p><Button asChild className="mt-6"><Link href="/">Về trang chủ</Link></Button></section></main>
}
