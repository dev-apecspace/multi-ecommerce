'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Clock, LogOut, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VendorPendingPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <div className="flex justify-center mb-6">
            <Clock className="h-16 w-16 text-yellow-500 animate-spin" />
          </div>

          <h1 className="text-2xl font-bold mb-4">Đang chờ duyệt</h1>
          <p className="text-muted-foreground mb-6">
            Cảm ơn bạn đã đăng ký bán hàng trên Sàn TMĐT. Đơn đăng ký của bạn đang được chúng tôi xem xét kỹ lưỡng.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Quy trình duyệt
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>✓ Nhân viên hành chính kiểm tra giấy phép kinh doanh</li>
              <li>✓ Xác minh thông tin tài chính</li>
              <li>✓ Đánh giá khả năng kinh doanh</li>
              <li>• Phê duyệt cuối cùng (đang xử lý)</li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Bạn sẽ nhận được email thông báo khi đơn được duyệt. Thường mất từ 1-3 ngày làm việc.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Email đăng ký:</strong> {user?.email}
            </p>
          </div>

          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Đăng xuất
          </Button>

          <p className="text-xs text-muted-foreground mt-6">
            Có câu hỏi? Liên hệ{' '}
            <a href="mailto:support@example.com" className="text-primary hover:underline">
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
