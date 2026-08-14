'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function VendorApprovalBanner() {
  const { user } = useAuth()
  const [vendorStatus, setVendorStatus] = useState<string | null>(null)
  const [statusLoaded, setStatusLoaded] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'vendor') return

    let active = true
    fetch('/api/seller/vendor', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Không thể tải trạng thái shop')
        return response.json()
      })
      .then((data) => {
        if (active) setVendorStatus(data.vendor?.status ?? null)
      })
      .catch(() => {
        // Vendor là nguồn trạng thái chuẩn. Chỉ dùng trạng thái user khi API tạm thời lỗi.
        if (active) setVendorStatus(user.status ?? null)
      })
      .finally(() => {
        if (active) setStatusLoaded(true)
      })

    return () => {
      active = false
    }
  }, [user])

  if (!user || user.role !== 'vendor') {
    return null
  }

  // Không suy ra shop đã được duyệt từ VendorDocument. Hồ sơ được duyệt chỉ là
  // điều kiện để admin tiếp tục duyệt trạng thái Vendor ở bước riêng.
  const approvalStatus = statusLoaded ? vendorStatus : null

  if (approvalStatus === 'approved') {
    return (
      <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-300">
          ✓ Tài khoản của bạn đã được phê duyệt! Bạn có thể sử dụng tất cả các tính năng.
        </AlertDescription>
      </Alert>
    )
  }

  if (approvalStatus === 'pending' || approvalStatus === 'pending_approval' || !approvalStatus) {
    return (
      <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <div className="text-yellow-800 dark:text-yellow-300">
            <p className="font-semibold mb-2">
              ⏳ Shop của bạn đang chờ phê duyệt
            </p>
            <p className="text-sm mb-3">
              Hồ sơ đã được duyệt chỉ là điều kiện cần. Quản trị viên sẽ duyệt shop ở bước tiếp theo;
              các chức năng khác chỉ được mở khóa sau khi shop được duyệt.
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

  if (approvalStatus === 'rejected') {
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
