'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { File, Upload, Trash2, Clock, CheckCircle, XCircle, Download } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { useLoading } from '@/hooks/use-loading'
import { usePagination } from '@/hooks/use-pagination'
import { Pagination } from '@/components/pagination'
import { VendorApprovalBanner } from '@/components/vendor-approval-banner'

interface Document {
  id: number
  vendorId: number
  documentType: string
  documentName: string
  documentUrl: string
  status: string
  reviewNotes?: string
  uploadedAt: string
}



export default function SellerDocumentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { setIsLoading } = useLoading()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    documentName: '',
    file: null as File | null,
  })
  const pagination = usePagination({ initialPage: 1, initialLimit: 20 })
  const hasApprovedDocument = documents.some((document) => document.status === 'approved')

  useEffect(() => {
    if (user?.id) {
      fetchDocuments()
    }
  }, [user?.id, pagination.page, pagination.limit])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      setIsLoading(true)
      const url = new URL('/api/seller/documents', typeof window !== 'undefined' ? window.location.origin : '')
      url.searchParams.append('limit', pagination.limit.toString())
      url.searchParams.append('offset', pagination.offset.toString())
      
      const response = await fetch(url.toString(), {
        credentials: 'include'
      })
      const data = await response.json()

      if (response.ok) {
        setDocuments(data.data || [])
        pagination.setTotal(data.pagination?.total || 0)
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể tải danh sách tài liệu',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi tải tài liệu',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFormData(prev => ({ ...prev, file }))
  }

  const handleUpload = async () => {
    if (hasApprovedDocument) {
      toast({ title: 'Hồ sơ đã được duyệt', description: 'Bạn không thể tải thêm hoặc thay thế hồ sơ sau khi đã được duyệt.', variant: 'destructive' })
      return
    }
    if (!user?.id) {
      toast({
        title: 'Lỗi',
        description: 'Bạn cần đăng nhập để tải lên tài liệu',
        variant: 'destructive',
      })
      return
    }

    if (!formData.documentName || !formData.file) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên tài liệu và chọn file',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', formData.file)

      const uploadResponse = await fetch('/api/seller/upload', {
        method: 'POST',
        body: uploadFormData,
        credentials: 'include'
      })

      if (!uploadResponse.ok) {
        throw new Error('File upload failed')
      }

      const uploadedFile = await uploadResponse.json()

      const response = await fetch('/api/seller/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentName: formData.documentName,
          documentUrl: uploadedFile.url,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: 'Tài liệu đã được tải lên thành công',
        })
        setFormData({
          documentName: '',
          file: null,
        })
        const fileInput = document.getElementById('documentFile') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        fetchDocuments()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể tải lên tài liệu',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentId: number) => {
    try {
      const response = await fetch(`/api/seller/documents?id=${documentId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: 'Tài liệu đã được xóa',
        })
        fetchDocuments()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Delete failed')
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể xóa tài liệu',
        variant: 'destructive',
      })
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const pendingCount = documents.filter(d => d.status === 'pending').length
  const approvedCount = documents.filter(d => d.status === 'approved').length
  const rejectedCount = documents.filter(d => d.status === 'rejected').length

  return (
    <main className="p-6">
      <VendorApprovalBanner />
      <h1 className="text-3xl font-bold mb-8">Quản lý tài liệu shop</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Tổng tài liệu</p>
            <p className="text-3xl font-bold mt-2">{documents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Chờ duyệt</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Đã duyệt</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Bị từ chối</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{hasApprovedDocument ? 'Hồ sơ đã được duyệt' : 'Tải lên tài liệu mới'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasApprovedDocument && <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Hồ sơ shop đã được duyệt. Chức năng tải lên đã được khóa để bảo toàn hồ sơ đã xác nhận.</p>}
            <div>
              <Label htmlFor="documentName">Tên tài liệu</Label>
              <Input
                id="documentName"
                name="documentName"
                placeholder="Ví dụ: Giấy phép kinh doanh 2024"
                value={formData.documentName}
                onChange={handleInputChange}
                className="mt-2"
                disabled={hasApprovedDocument}
              />
            </div>

            <div>
              <Label htmlFor="documentFile">Chọn file</Label>
              <Input
                id="documentFile"
                type="file"
                onChange={handleFileChange}
                disabled={hasApprovedDocument}
                className="mt-2"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Hỗ trợ: PDF, DOC, DOCX, JPG, PNG, GIF
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || hasApprovedDocument}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Đang tải lên...' : 'Tải lên'}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Danh sách tài liệu</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <File className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Chưa có tài liệu nào</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tải lên tài liệu kinh doanh để hoàn thành hồ sơ shop
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-start justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <File className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm break-words">{doc.documentName}</h4>
                          <p className="text-xs text-muted-foreground">
                            Tải lên: {new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}
                          </p>
                          {doc.reviewNotes && (
                            <div className="mt-2 p-2 bg-background rounded text-xs">
                              <p className="font-semibold mb-1">Nhận xét:</p>
                              <p>{doc.reviewNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(doc.status)}
                          <Badge variant={getStatusBadgeVariant(doc.status)}>
                            {getStatusText(doc.status)}
                          </Badge>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(doc.documentUrl, '_blank')}
                          title="Xem tài liệu"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        {doc.status === 'pending' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                title="Xóa tài liệu"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogTitle>Xóa tài liệu</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn xóa tài liệu "{doc.documentName}"? Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                              <div className="flex gap-3 justify-end">
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(doc.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Xóa
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            
            {documents.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={pagination.goToPage}
                  limit={pagination.limit}
                  onLimitChange={pagination.setPageLimit}
                  total={pagination.total}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Hướng dẫn tải lên tài liệu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold mb-1">📄 Tài liệu bắt buộc:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Giấy phép kinh doanh</li>
              <li>Mã số thuế (nếu có)</li>
              <li>Chứng minh nhân dân/Hộ chiếu (của chủ shop)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">📤 Cách tải lên:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Chuẩn bị tài liệu dưới dạng PDF hoặc hình ảnh</li>
              <li>Upload lên cloud storage (Cloudinary, Google Drive, v.v.)</li>
              <li>Copy link chia sẻ của tài liệu</li>
              <li>Chọn loại tài liệu, điền thông tin và dán link vào form trên</li>
              <li>Click "Tải lên" để gửi</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold mb-1">⏳ Thời gian duyệt:</p>
            <p className="text-muted-foreground">
              Admin sẽ duyệt tài liệu của bạn trong vòng 1-3 ngày làm việc.
              Bạn có thể xem trạng thái tại trang này.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
