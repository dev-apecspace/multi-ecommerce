'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, File, Download, Check, X, Lock, Unlock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Vendor {
  id: number
  name: string
  status: string
  joinDate: string
  rating: number
  products: number
  followers: number
  Shop?: {
    id?: number
    name?: string
    image?: string
    ShopDetail?: {
      email?: string
      phone?: string
      address?: string
      taxId?: string
      businessLicense?: string
      bankAccount?: string
      bankName?: string
    }
  }
}

interface VendorDocument {
  id: number
  vendorId: number
  documentType: string
  documentName: string
  documentUrl: string
  status: string
  reviewNotes?: string
  uploadedAt: string
}

interface VendorModalProps {
  vendor: Vendor | null
  documents: VendorDocument[]
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  onDeleteVendor?: (vendorId: number) => void
  onApproveDocument?: (documentId: number, notes: string) => void
  onRejectDocument?: (documentId: number, notes: string) => void
  loading?: boolean
  mode?: 'details' | 'management'
}

export default function AdminVendorModal({
  vendor,
  documents,
  isOpen,
  onClose,
  onSave,
  onDeleteVendor,
  onApproveDocument,
  onRejectDocument,
  loading = false,
  mode = 'details',
}: VendorModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: vendor?.name || '',
  })
  const [reviewNotes, setReviewNotes] = useState<{ [key: number]: string }>({})
  const [activeTab, setActiveTab] = useState(mode === 'management' ? 'management' : 'details')
  const [newStatus, setNewStatus] = useState(vendor?.status || 'pending')
  const [showLockDialog, setShowLockDialog] = useState(false)
  const [lockReason, setLockReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const isLocked = vendor?.Shop?.locked || false

  const showDetailsTab = mode === 'details'
  const showManagementTab = mode === 'management'

  if (!vendor) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }



  const handleSave = () => {
    onSave(formData)
  }

  const handleDelete = () => {
    if (confirm('Bạn có chắc muốn xóa nhà cung cấp này? Hành động này không thể hoàn tác.')) {
      onDeleteVendor?.(vendor.id)
    }
  }

  const handleApproveDoc = (docId: number) => {
    onApproveDocument?.(docId, reviewNotes[docId] || '')
  }

  const handleRejectDoc = (docId: number) => {
    onRejectDocument?.(docId, reviewNotes[docId] || '')
  }

  const handleStatusChange = async (value: string) => {
    if (value === vendor.status) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/vendors?id=${vendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: value }),
      })

      if (response.ok) {
        setNewStatus(value)
        toast({
          title: 'Thành công',
          description: `Cập nhật trạng thái thành "${
            value === 'approved' ? 'Đã duyệt' : value === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'
          }"`,
        })
        onSave?.({ status: value })
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
      setIsProcessing(false)
    }
  }

  const handleLock = async () => {
    setIsProcessing(true)
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
        onSave?.({})
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
      setIsProcessing(false)
    }
  }

  const handleUnlock = async () => {
    setIsProcessing(true)
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
        onSave?.({})
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
      setIsProcessing(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default'
      case 'rejected':
        return 'destructive'
      case 'pending':
        return 'secondary'
      default:
        return 'outline'
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${mode === 'management' ? 'max-w-2xl' : 'max-w-3xl'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>
            {mode === 'management' ? 'Duyệt/Khóa nhà cung cấp' : 'Chi tiết nhà cung cấp'}: {vendor.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${mode === 'management' ? 'grid-cols-1' : 'grid-cols-4'}`}>
            {showDetailsTab && (
              <>
                <TabsTrigger value="details">Thông tin</TabsTrigger>
                <TabsTrigger value="documents">Tài liệu ({documents.length})</TabsTrigger>
                <TabsTrigger value="shop">Chi tiết shop</TabsTrigger>
              </>
            )}
            {showManagementTab && <TabsTrigger value="management">Duyệt/Khóa</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Tên nhà cung cấp</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ngày tham gia</Label>
                <p className="mt-2 text-sm text-muted-foreground">
                  {new Date(vendor.joinDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div>
                <Label>Đánh giá</Label>
                <p className="mt-2 text-sm text-muted-foreground">{vendor.rating}/5</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sản phẩm</Label>
                <p className="mt-2 text-sm text-muted-foreground">{vendor.products}</p>
              </div>
              <div>
                <Label>Người theo dõi</Label>
                <p className="mt-2 text-sm text-muted-foreground">{vendor.followers}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý trạng thái và khóa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="status-select" className="mb-2 block">
                    Trạng thái duyệt
                  </Label>
                  <Select
                    value={newStatus}
                    onValueChange={handleStatusChange}
                    disabled={isProcessing}
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

                <div className="border-t pt-4">
                  <Label className="mb-2 block">Trạng thái khóa</Label>
                  <div className="flex items-center gap-2 mb-4">
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

                  {isLocked && vendor.Shop?.lockedReason && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                      <p className="text-sm font-semibold text-red-900 mb-1">Lý do khóa:</p>
                      <p className="text-sm text-red-700">{vendor.Shop.lockedReason}</p>
                    </div>
                  )}

                  {!isLocked ? (
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setShowLockDialog(true)}
                      disabled={isProcessing}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Khóa nhà cung cấp
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleUnlock}
                      disabled={isProcessing}
                    >
                      {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Unlock className="h-4 w-4 mr-2" />
                      Mở khóa
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có tài liệu nào
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <Card key={doc.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <File className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">{doc.documentName}</h4>
                              <p className="text-xs text-muted-foreground">
                                Loại: {doc.documentType}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Tải lên: {new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(doc.status)}>
                            {getStatusText(doc.status)}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.open(doc.documentUrl, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Xem
                          </Button>
                        </div>

                        {doc.status === 'pending' && (
                          <>
                            <Textarea
                              placeholder="Nhận xét duyệt (tùy chọn)"
                              value={reviewNotes[doc.id] || ''}
                              onChange={(e) =>
                                setReviewNotes(prev => ({
                                  ...prev,
                                  [doc.id]: e.target.value,
                                }))
                              }
                              className="text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveDoc(doc.id)}
                                disabled={loading}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Phê duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-red-600 hover:text-red-700"
                                onClick={() => handleRejectDoc(doc.id)}
                                disabled={loading}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Từ chối
                              </Button>
                            </div>
                          </>
                        )}

                        {doc.reviewNotes && (
                          <div className="bg-muted p-2 rounded text-sm">
                            <p className="font-semibold text-xs mb-1">Nhận xét:</p>
                            <p className="text-xs">{doc.reviewNotes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shop" className="space-y-4">
            {vendor.Shop ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tên shop</Label>
                    <p className="mt-2 text-sm text-muted-foreground">{vendor.Shop.name || '-'}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {vendor.Shop.ShopDetail?.email || '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Điện thoại</Label>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {vendor.Shop.ShopDetail?.phone || '-'}
                    </p>
                  </div>
                  <div>
                    <Label>Mã số thuế</Label>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {vendor.Shop.ShopDetail?.taxId || '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Địa chỉ</Label>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {vendor.Shop.ShopDetail?.address || '-'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ngân hàng</Label>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {vendor.Shop.ShopDetail?.bankName || '-'}
                    </p>
                  </div>
                  <div>
                    <Label>Tài khoản ngân hàng</Label>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {vendor.Shop.ShopDetail?.bankAccount || '-'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có thông tin shop
              </div>
            )}
          </TabsContent>
        </Tabs>

        {showDetailsTab && (
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Xóa
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Đóng
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        )}
        {showManagementTab && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Đóng
            </Button>
          </DialogFooter>
        )}
      </DialogContent>

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

          <AlertDialogCancel disabled={isProcessing}>
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLock}
            disabled={isProcessing || !lockReason.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Xác nhận khóa
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
