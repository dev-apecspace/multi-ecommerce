"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle, XCircle, Clock, Plus, Trash2, Lock } from "lucide-react"
import { useAdminVendors } from "@/hooks/useSupabase"
import AdminVendorModal from "@/components/admin-vendor-modal"
import { useToast } from "@/hooks/use-toast"

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

export default function AdminVendorsPage() {
  const [status, setStatus] = useState<string>("all")
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false)
  const [documents, setDocuments] = useState<VendorDocument[]>([])
  const [loading, setLoading] = useState(false)
  const { data: allVendorsData, loading: vendorsLoading, error, fetchVendors } = useAdminVendors(status === "all" ? undefined : status)
  const { toast } = useToast()

  useEffect(() => {
    fetchVendors()
  }, [status, fetchVendors])

  useEffect(() => {
    if (selectedVendor && isDetailsModalOpen) {
      fetchDocuments(selectedVendor.id)
    }
  }, [selectedVendor, isDetailsModalOpen])

  const allVendors = Array.isArray(allVendorsData) ? allVendorsData : []

  const fetchDocuments = async (vendorId: number) => {
    try {
      const response = await fetch(`/api/admin/vendor-documents?vendorId=${vendorId}`)
      const data = await response.json()
      setDocuments(data.data || [])
    } catch (err) {
      console.error("Failed to fetch documents:", err)
    }
  }

  const handleOpenDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsDetailsModalOpen(true)
  }

  const handleOpenManagement = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsManagementModalOpen(true)
  }

  const handleSaveVendor = async (formData: any) => {
    if (!selectedVendor) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/vendors?id=${selectedVendor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Cập nhật nhà cung cấp thành công",
        })
        fetchVendors()
        setIsModalOpen(false)
      } else {
        throw new Error("Failed to update vendor")
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật nhà cung cấp",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVendor = async (vendorId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/vendors?id=${vendorId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Xóa nhà cung cấp thành công",
        })
        fetchVendors()
        setIsModalOpen(false)
      } else {
        throw new Error("Failed to delete vendor")
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa nhà cung cấp",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveDocument = async (documentId: number, notes: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/vendor-documents?id=${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          reviewNotes: notes,
          reviewedAt: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Phê duyệt tài liệu thành công",
        })
        if (selectedVendor) {
          fetchDocuments(selectedVendor.id)
        }
      } else {
        throw new Error("Failed to approve document")
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể phê duyệt tài liệu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRejectDocument = async (documentId: number, notes: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/vendor-documents?id=${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          reviewNotes: notes,
          reviewedAt: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Từ chối tài liệu thành công",
        })
        if (selectedVendor) {
          fetchDocuments(selectedVendor.id)
        }
      } else {
        throw new Error("Failed to reject document")
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể từ chối tài liệu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (vendorsLoading) {
    return (
      <main className="p-6">
        <p className="text-center">Đang tải danh sách nhà cung cấp...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="p-6">
        <p className="text-center text-red-500">Lỗi: {error}</p>
      </main>
    )
  }

  const pendingCount = allVendors.filter((v: any) => v.status === "pending").length
  const approvedCount = allVendors.filter((v: any) => v.status === "approved").length
  const rejectedCount = allVendors.filter((v: any) => v.status === "rejected").length

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quản lý nhà cung cấp</h1>
        <Button onClick={() => {}} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm nhà cung cấp
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Chờ duyệt</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {pendingCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Đã phê duyệt</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {approvedCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Bị từ chối</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {rejectedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách nhà cung cấp</CardTitle>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã phê duyệt</SelectItem>
              <SelectItem value="rejected">Bị từ chối</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Tên shop</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-left py-3 px-4">Khóa</th>
                  <th className="text-left py-3 px-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {allVendors.length > 0 ? (
                  allVendors.map((vendor: any) => (
                    <tr key={vendor.id} className="border-b border-border hover:bg-surface dark:hover:bg-slate-900">
                      <td className="py-3 px-4 font-semibold">{vendor.name}</td>
                      <td className="py-3 px-4">{vendor.Shop?.ShopDetail?.email || "-"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {vendor.status === "approved" && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {vendor.status === "pending" && <Clock className="h-4 w-4 text-yellow-600" />}
                          {vendor.status === "rejected" && <XCircle className="h-4 w-4 text-red-600" />}
                          <span className="capitalize">
                            {vendor.status === "pending"
                              ? "Chờ duyệt"
                              : vendor.status === "approved"
                                ? "Đã duyệt"
                                : "Bị từ chối"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {vendor.Shop?.locked && (
                          <div className="flex items-center gap-1 text-red-600">
                            <Lock className="h-4 w-4" />
                            <span className="text-xs">Đã khóa</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetails(vendor)}
                        >
                          Chi tiết
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleOpenManagement(vendor)}
                        >
                          Duyệt/Khóa
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-muted-foreground">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedVendor && (
        <>
          <AdminVendorModal
            vendor={selectedVendor}
            documents={documents}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            onSave={handleSaveVendor}
            onDeleteVendor={handleDeleteVendor}
            onApproveDocument={handleApproveDocument}
            onRejectDocument={handleRejectDocument}
            loading={loading}
            mode="details"
          />
          <AdminVendorModal
            vendor={selectedVendor}
            documents={documents}
            isOpen={isManagementModalOpen}
            onClose={() => setIsManagementModalOpen(false)}
            onSave={handleSaveVendor}
            onDeleteVendor={handleDeleteVendor}
            onApproveDocument={handleApproveDocument}
            onRejectDocument={handleRejectDocument}
            loading={loading}
            mode="management"
          />
        </>
      )}
    </main>
  )
}
