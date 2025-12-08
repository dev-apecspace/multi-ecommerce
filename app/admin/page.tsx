"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, Clock, AlertCircle, Eye, Download, User, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedVendor, setSelectedVendor] = useState<any>(null)

  const pendingVendors = [
    {
      id: 1,
      shopName: "Samsung Việt Nam",
      ownerName: "Nguyễn Văn A",
      email: "contact@samsung-vn.vn",
      phone: "0981234567",
      taxId: "0123456789",
      submittedDate: "2025-01-15",
      status: "pending",
      documents: {
        idCard: "uploaded",
        businessLicense: "uploaded",
        bankStatement: "uploaded",
      },
    },
    {
      id: 2,
      shopName: "Apple Store Hà Nội",
      ownerName: "Trần Thị B",
      email: "hano@applestore.vn",
      phone: "0912345678",
      taxId: "0987654321",
      submittedDate: "2025-01-14",
      status: "pending",
      documents: {
        idCard: "uploaded",
        businessLicense: "uploaded",
        bankStatement: "pending",
      },
    },
  ]

  const approvedVendors = [
    {
      id: 3,
      shopName: "Sony Việt Nam",
      ownerName: "Phạm Công C",
      email: "contact@sony-vn.vn",
      phone: "0941234567",
      status: "approved",
      approvedDate: "2025-01-10",
      products: 450,
      commission: "5%",
    },
    {
      id: 4,
      shopName: "LG Electronics",
      ownerName: "Lê Đức D",
      email: "contact@lg-vn.vn",
      phone: "0951234567",
      status: "approved",
      approvedDate: "2025-01-05",
      products: 320,
      commission: "5%",
    },
  ]

  const rejectedVendors = [
    {
      id: 5,
      shopName: "Unknown Shop",
      ownerName: "Võ Văn E",
      email: "unknown@shop.vn",
      status: "rejected",
      rejectionReason: "Tài liệu không hợp lệ",
      rejectedDate: "2025-01-08",
    },
  ]

  const stats = {
    pending: pendingVendors.length,
    approved: approvedVendors.length,
    rejected: rejectedVendors.length,
    total: pendingVendors.length + approvedVendors.length + rejectedVendors.length,
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <div className="container-viewport py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bảng điều khiển quản lý</h1>
          <p className="text-muted-foreground">Quản lý người bán, danh mục, đơn hàng</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">CHỜ DUYỆT</p>
                  <p className="text-3xl font-bold mt-1">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">ĐÃ PHÁT HÀNH</p>
                  <p className="text-3xl font-bold mt-1">{stats.approved}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">TỪ CHỐI</p>
                  <p className="text-3xl font-bold mt-1">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">TỔNG CỘng</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <Store className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Chờ duyệt ({stats.pending})</TabsTrigger>
            <TabsTrigger value="approved">Đã phát hành ({stats.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối ({stats.rejected})</TabsTrigger>
            <TabsTrigger value="categories">Danh mục</TabsTrigger>
          </TabsList>

          {/* Pending Vendors */}
          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              {pendingVendors.map((vendor) => (
                <Card key={vendor.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-5 w-5 text-primary" />
                          <h3 className="font-bold text-lg">{vendor.shopName}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                          <div>
                            <p className="text-muted-foreground text-xs">Chủ sở hữu</p>
                            <p className="font-medium">{vendor.ownerName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Email</p>
                            <p className="font-medium">{vendor.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Điện thoại</p>
                            <p className="font-medium">{vendor.phone}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Mã số thuế</p>
                            <p className="font-medium">{vendor.taxId}</p>
                          </div>
                        </div>

                        {/* Document Status */}
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs font-semibold mb-2 text-muted-foreground">TRẠNG THÁI TÀI LIỆU</p>
                          <div className="flex gap-4 text-xs">
                            {Object.entries(vendor.documents).map(([key, status]) => (
                              <div key={key} className="flex items-center gap-1">
                                {status === "uploaded" ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                )}
                                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedVendor(vendor)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Chi tiết
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>{selectedVendor?.shopName}</DialogTitle>
                              <DialogDescription>Thông tin chi tiết của người bán</DialogDescription>
                            </DialogHeader>
                            {selectedVendor && (
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-semibold mb-1">Tên cửa hàng</p>
                                  <p className="text-sm">{selectedVendor.shopName}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold mb-1">Chủ sở hữu</p>
                                  <p className="text-sm">{selectedVendor.ownerName}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold mb-1">Email</p>
                                  <p className="text-sm">{selectedVendor.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold mb-1">Điện thoại</p>
                                  <p className="text-sm">{selectedVendor.phone}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold mb-1">Mã số thuế</p>
                                  <p className="text-sm">{selectedVendor.taxId}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold mb-1">Ngày gửi</p>
                                  <p className="text-sm">{selectedVendor.submittedDate}</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => alert("Đã phê duyệt: " + vendor.shopName)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Phê duyệt
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => alert("Đã từ chối: " + vendor.shopName)}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Từ chối
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Tài liệu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Approved Vendors */}
          <TabsContent value="approved" className="mt-6">
            <div className="space-y-4">
              {approvedVendors.map((vendor) => (
                <Card key={vendor.id} className="border-green-200 dark:border-green-900">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <h3 className="font-bold text-lg">{vendor.shopName}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                          <div>
                            <p className="text-muted-foreground text-xs">Chủ sở hữu</p>
                            <p className="font-medium">{vendor.ownerName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Sản phẩm</p>
                            <p className="font-medium">{vendor.products}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Hoa hồng</p>
                            <p className="font-medium">{vendor.commission}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Phê duyệt lúc</p>
                            <p className="font-medium">{vendor.approvedDate}</p>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        Quản lý
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rejected Vendors */}
          <TabsContent value="rejected" className="mt-6">
            <div className="space-y-4">
              {rejectedVendors.map((vendor) => (
                <Card key={vendor.id} className="border-red-200 dark:border-red-900">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <h3 className="font-bold text-lg">{vendor.shopName}</h3>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-muted-foreground text-xs">Chủ sở hữu</p>
                            <p className="font-medium">{vendor.ownerName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Lý do từ chối</p>
                            <p className="font-medium text-red-600">{vendor.rejectionReason}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Ngày từ chối</p>
                            <p className="font-medium">{vendor.rejectedDate}</p>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        Hồi quy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Quản lý danh mục</CardTitle>
                <Button>Thêm danh mục</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Thời trang", "Điện tử", "Nhà cửa & đời sống", "Sức khỏe & sắc đẹp", "Mẹ & bé"].map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-surface dark:bg-slate-800 rounded-lg"
                    >
                      <span className="font-medium">{cat}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Sửa
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive bg-transparent">
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
