'use client'

import { useAuth } from '@/lib/auth-context'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function VendorApprovalBanner() {
  const { user } = useAuth()

  if (!user || user.role !== 'vendor') {
    return null
  }

  if (user.status === 'active' || user.status === 'approved') {
    return (
      <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-300">
          ✓ Tài khoản của bạn đã được phê duyệt! Bạn có thể sử dụng tất cả các tính năng.
        </AlertDescription>
      </Alert>
    )
  }

  if (user.status === 'pending' || user.status === 'pending_approval') {
    return (
      <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <div className="text-yellow-800 dark:text-yellow-300">
            <p className="font-semibold mb-2">
              ⏳ Hồ sơ của bạn đang chờ phê duyệt
            </p>
            <p className="text-sm mb-3">
              Bạn có thể tiếp tục hoàn thành hồ sơ, tải lên tài liệu, và cập nhật thông tin shop.
              Các chức năng khác sẽ được mở khóa khi hồ sơ được phê duyệt.
            </p>
            <div className="flex gap-2">
              <Link href="/seller/documents">
                <Button size="sm" variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-900/50">
                  Quản lý tài liệu
                </Button>
              </Link>
              <Link href="/seller/pending-approval">
                <Button size="sm" variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-900/50">
                  Xem chi tiết
                </Button>
              </Link>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (user.status === 'rejected') {
    return (
      <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription>
          <div className="text-red-800 dark:text-red-300">
            <p className="font-semibold mb-2">
              ❌ Hồ sơ của bạn đã bị từ chối
            </p>
            <p className="text-sm mb-3">
              Vui lòng liên hệ với bộ phận hỗ trợ để biết lý do chi tiết và cách khắc phục.
            </p>
            <Button size="sm" variant="outline" className="bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50">
              <a href="mailto:support@example.com">
                Liên hệ hỗ trợ
              </a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
