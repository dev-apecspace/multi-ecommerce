'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Lock, Unlock, Check, X, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Vendor {
  id: number
  name: string
  status: string
  joinDate: string
  Shop?: {
    locked?: boolean
    lockedReason?: string
    lockedAt?: string
  }
}

interface VendorActionsProps {
  vendor: Vendor
  onUpdate?: () => void
}

export default function AdminVendorActions({
  vendor,
  onUpdate,
}: VendorActionsProps) {
  const [newStatus, setNewStatus] = useState(vendor.status)
  const [loading, setLoading] = useState(false)
  const [showLockDialog, setShowLockDialog] = useState(false)
  const [lockReason, setLockReason] = useState('')
  const { toast } = useToast()

  const isLocked = vendor.Shop?.locked || false

  const handleStatusChange = async (newValue: string) => {
    if (newValue === vendor.status) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/vendors?id=${vendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newValue }),
      })

      if (response.ok) {
        setNewStatus(newValue)
        toast({
          title: 'Thành công',
          description: `Cập nhật trạng thái nhà cung cấp thành "${
            newValue === 'approved' ? 'Đã duyệt' : newValue === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'
          }"`,
        })
        onUpdate?.()
      } else {
        throw new Error('Failed to update status')
      }
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      })
      setNewStatus(vendor.status)
    } finally {
      setLoading(false)
    }
  }

  const handleLock = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/vendors?id=${vendor.id}&action=lock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: lockReason }),
      })

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: 'Khóa nhà cung cấp thành công',
        })
        setShowLockDialog(false)
        setLockReason('')
        onUpdate?.()
      } else {
        throw new Error('Failed to lock vendor')
      }
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: 'Không thể khóa nhà cung cấp',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/vendors?id=${vendor.id}&action=unlock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: 'Mở khóa nhà cung cấp thành công',
        })
        onUpdate?.()
      } else {
        throw new Error('Failed to unlock vendor')
      }
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: 'Không thể mở khóa nhà cung cấp',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Đã duyệt'
      case 'rejected':
        return 'Bị từ chối'
      case 'pending':
        return 'Chờ duyệt'
      default:
        return status
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý nhà cung cấp: {vendor.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="status-select" className="mb-2 block">
              Trạng thái duyệt
            </Label>
            <Select
              value={newStatus}
              onValueChange={handleStatusChange}
              disabled={loading}
            >
              <SelectTrigger id="status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-600"></span>
                    Chờ duyệt
                  </div>
                </SelectItem>
                <SelectItem value="approved">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    Đã duyệt
                  </div>
                </SelectItem>
                <SelectItem value="rejected">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    Bị từ chối
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Trạng thái khóa</Label>
            <div className="flex items-center gap-2">
              <Badge
                variant={isLocked ? 'destructive' : 'default'}
                className="px-3 py-1"
              >
                {isLocked ? (
                  <Lock className="h-3 w-3 mr-1" />
                ) : (
                  <Unlock className="h-3 w-3 mr-1" />
                )}
                {isLocked ? 'Đã khóa' : 'Đang hoạt động'}
              </Badge>
            </div>
          </div>
        </div>

        {isLocked && vendor.Shop?.lockedReason && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm font-semibold text-red-900 mb-1">Lý do khóa:</p>
            <p className="text-sm text-red-700">{vendor.Shop.lockedReason}</p>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          {!isLocked ? (
            <Button
              variant="outline"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setShowLockDialog(true)}
              disabled={loading}
            >
              <Lock className="h-4 w-4 mr-2" />
              Khóa nhà cung cấp
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleUnlock}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Unlock className="h-4 w-4 mr-2" />
              Mở khóa
            </Button>
          )}
        </div>
      </CardContent>

      <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Khóa nhà cung cấp</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng nhập lý do khóa nhà cung cấp
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Lý do khóa (vd: Vi phạm chính sách, chất lượng sản phẩm kém...)"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <AlertDialogCancel disabled={loading}>
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLock}
            disabled={loading || !lockReason.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Xác nhận khóa
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
