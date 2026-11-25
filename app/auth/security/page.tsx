import { ChangePasswordCard } from '@/components/auth/change-password-card'

export default function AccountSecurityPage() {
  return <main className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-8"><header><p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Bảo mật tài khoản</p><h1 className="mt-1 text-2xl font-bold">Cài đặt bảo mật</h1><p className="mt-2 text-sm text-muted-foreground">Cập nhật mật khẩu đăng nhập của tài khoản hiện tại.</p></header><ChangePasswordCard /></main>
}
