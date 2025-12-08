'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Clock, FileText, User, Settings, AlertCircle, CheckCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ALLOWED_FEATURES = [
  {
    icon: FileText,
    title: 'Tài liệu shop',
    description: 'Upload, chỉnh sửa và quản lý tài liệu kinh doanh của bạn',
    href: '/seller/documents',
    available: true,
  },
  {
    icon: User,
    title: 'Hồ sơ shop',
    description: 'Cập nhật thông tin cơ bản, email, điện thoại, địa chỉ',
    href: '/seller/profile',
    available: true,
  },
  {
    icon: Settings,
    title: 'Cài đặt shop',
    description: 'Quản lý cài đặt và tùy chỉnh shop của bạn',
    href: '/seller/settings',
    available: true,
  },
]

const RESTRICTED_FEATURES = [
  {
    icon: FileText,
    title: 'Quản lý sản phẩm',
    description: 'Thêm, sửa, xóa sản phẩm và quản lý kho hàng',
    reason: 'Yêu cầu phê duyệt hồ sơ',
  },
  {
    icon: FileText,
    title: 'Quản lý đơn hàng',
    description: 'Xem và quản lý các đơn hàng từ khách',
    reason: 'Yêu cầu phê duyệt hồ sơ',
  },
  {
    icon: FileText,
    title: 'Ví tiền & Doanh thu',
    description: 'Xem doanh thu, lịch sử giao dịch',
    reason: 'Yêu cầu phê duyệt hồ sơ',
  },
  {
    icon: FileText,
    title: 'Rút tiền',
    description: 'Yêu cầu rút tiền về tài khoản ngân hàng',
    reason: 'Yêu cầu phê duyệt hồ sơ',
  },
]

export default function PendingApprovalPage() {
  const { user, logout, refreshUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) return

    const checkApprovalStatus = async () => {
      const updatedUser = await refreshUser()
      if (updatedUser && (updatedUser.status === 'active' || updatedUser.status === 'approved')) {
        router.push('/seller/dashboard')
      }
    }

    checkApprovalStatus()
    const interval = setInterval(checkApprovalStatus, 5000)

    return () => clearInterval(interval)
  }, [user?.id, refreshUser, router])

  const handleLogout = async () => {
    await logout()
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Clock className="h-16 w-16 text-yellow-500 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Hồ sơ đang chờ phê duyệt</h1>
          <p className="text-lg text-muted-foreground">
            Cảm ơn bạn đã đăng ký bán hàng. Admin đang xem xét hồ sơ của bạn.
          </p>
          <p className="text-muted-foreground mt-2">
            Email: <span className="font-semibold">{user?.email}</span>
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-8 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-yellow-900 dark:text-yellow-200 mb-2">
                  Thời gian xử lý
                </h3>
                <p className="text-yellow-800 dark:text-yellow-300">
                  Đơn đăng ký của bạn thường sẽ được xử lý trong vòng <strong>1-3 ngày làm việc</strong>.
                  Chúng tôi sẽ gửi email thông báo ngay khi hoàn tất kiểm tra.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Allowed Features */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold">Bạn có thể làm được</h2>
            </div>
            <div className="space-y-4">
              {ALLOWED_FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <Link key={feature.href} href={feature.href}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Icon className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 bg-green-50 dark:bg-green-950/20 border-green-200 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                            >
                              Truy cập →
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Restricted Features */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Lock className="h-6 w-6 text-red-600" />
              <h2 className="text-2xl font-bold">Bị khóa cho đến khi được phê duyệt</h2>
            </div>
            <div className="space-y-4">
              {RESTRICTED_FEATURES.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card key={index} className="opacity-60">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Icon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                          <Lock className="h-4 w-4 text-red-600 absolute bottom-0 right-0 bg-background rounded-full p-0.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 text-gray-600 dark:text-gray-400">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                          <Badge variant="secondary" className="mt-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0">
                            {feature.reason}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Action Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Bước tiếp theo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold text-sm text-blue-700 dark:text-blue-300">
                  1
                </div>
                <div>
                  <p className="font-semibold">Kiểm tra tài liệu</p>
                  <p className="text-sm text-muted-foreground">
                    Đảm bảo tất cả tài liệu được tải lên đủ và đúng định dạng
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold text-sm text-blue-700 dark:text-blue-300">
                  2
                </div>
                <div>
                  <p className="font-semibold">Hoàn thành hồ sơ</p>
                  <p className="text-sm text-muted-foreground">
                    Cập nhật thông tin cơ bản về shop và liên hệ
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold text-sm text-blue-700 dark:text-blue-300">
                  3
                </div>
                <div>
                  <p className="font-semibold">Chờ admin duyệt</p>
                  <p className="text-sm text-muted-foreground">
                    Bạn sẽ nhận email khi hồ sơ được phê duyệt hoặc từ chối
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                <strong>💡 Mẹo:</strong> Hãy kiểm tra email thường xuyên. Đôi khi admin có thể gửi yêu cầu bổ sung tài liệu.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex gap-4 justify-center mt-8">
          <Button variant="outline" onClick={handleLogout}>
            Đăng xuất
          </Button>
          <Button variant="link">
            <a href="mailto:support@example.com">
              Liên hệ hỗ trợ
            </a>
          </Button>
        </div>
      </div>
    </main>
  )
}
