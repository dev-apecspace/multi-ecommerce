"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Check, X, Eye } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

type CampaignStatus = 'draft' | 'upcoming' | 'active' | 'ended'

const campaignStatusLabel: Record<CampaignStatus, string> = {
  draft: 'Khởi tạo',
  upcoming: 'Sắp diễn ra',
  active: 'Đang diễn ra',
  ended: 'Kết thúc',
}

const campaignStatusStyle: Record<CampaignStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  upcoming: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  ended: 'bg-neutral-200 text-neutral-700',
}

interface Campaign {
  id: number
  name: string
  description?: string
  type: 'percentage' | 'fixed'
  discountValue: number
  campaignType?: 'regular' | 'flash_sale'
  startDate: string
  endDate: string
  flashSaleStartTime?: string
  flashSaleEndTime?: string
  status: CampaignStatus
  budget?: number
  createdAt: string
  User: { id: number; name: string; email: string }
}

interface ProductRegistration {
  id: number
  campaignId: number
  vendorId: number
  productId: number
  variantId?: number
  quantity: number
  purchasedQuantity: number
  status: 'pending' | 'approved' | 'rejected'
  registeredAt: string
  approvedAt?: string
  rejectionReason?: string
  Campaign: { name: string }
  Vendor: { id: number; name: string }
  Product: { id: number; name: string; slug: string; price: number }
  ProductVariant?: { id: number; name: string; price: number }
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [productRegistrations, setProductRegistrations] = useState<ProductRegistration[]>([])
  const [approvedProducts, setApprovedProducts] = useState<ProductRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<ProductRegistration | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage',
    discountValue: 0,
    campaignType: 'regular' as 'regular' | 'flash_sale',
    startDate: '',
    endDate: '',
    flashSaleStartTime: '',
    flashSaleEndTime: '',
    budget: '',
    status: 'draft' as CampaignStatus,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchCampaigns()
    fetchProductRegistrations()
    fetchApprovedProducts()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/campaigns')
      const data = await response.json()
      setCampaigns(data.data || [])
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách chương trình khuyễn mãi',
        variant: 'destructive',
      })
    }
  }

  const fetchProductRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/campaigns/registrations?type=product&status=pending')
      const data = await response.json()
      setProductRegistrations(data.data || [])
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách sản phẩm chờ duyệt',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Vendor registrations no longer displayed; placeholder to avoid reference errors
  const fetchVendorRegistrations = async () => {}

  const fetchApprovedProducts = async () => {
    try {
      const response = await fetch('/api/admin/campaigns/registrations?type=product&status=approved')
      const data = await response.json()
      setApprovedProducts(data.data || [])
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách sản phẩm đã duyệt',
        variant: 'destructive',
      })
    }
  }

  const handleSaveCampaign = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ các trường bắt buộc',
        variant: 'destructive',
      })
      return
    }

    if (formData.campaignType === 'flash_sale' && (!formData.flashSaleStartTime || !formData.flashSaleEndTime)) {
      toast({
        title: 'Lỗi',
        description: 'Flash Sale phải có giờ bắt đầu và giờ kết thúc',
        variant: 'destructive',
      })
      return
    }

    const startDateObj = new Date(formData.startDate)
    const endDateObj = new Date(formData.endDate)
    if (startDateObj >= endDateObj) {
      toast({
        title: 'Lỗi',
        description: 'Ngày bắt đầu phải trước ngày kết thúc',
        variant: 'destructive',
      })
      return
    }

    try {
      const userId = localStorage.getItem('userId') || '1'
      const payload = {
        ...formData,
        discountValue: parseFloat(formData.discountValue.toString()),
        budget: formData.budget ? parseFloat(formData.budget) : null,
        createdBy: parseInt(userId),
        flashSaleStartTime: formData.campaignType === 'flash_sale' ? formData.flashSaleStartTime : null,
        flashSaleEndTime: formData.campaignType === 'flash_sale' ? formData.flashSaleEndTime : null,
        ...(editingCampaign && { campaignId: editingCampaign.id }),
      }

      const method = editingCampaign ? 'PATCH' : 'POST'
      const endpoint = '/api/admin/campaigns'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to save campaign')

      toast({
        title: 'Thành công',
        description: editingCampaign ? 'Cập nhật chương trình khuyễn mãi thành công' : 'Tạo chương trình khuyễn mãi thành công',
      })

      setOpenDialog(false)
      setEditingCampaign(null)
      setFormData({
        name: '',
        description: '',
        type: 'percentage',
        discountValue: 0,
        campaignType: 'regular',
        startDate: '',
        endDate: '',
        flashSaleStartTime: '',
        flashSaleEndTime: '',
        budget: '',
        status: 'draft',
      })
      fetchCampaigns()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu chương trình khuyễn mãi',
        variant: 'destructive',
      })
    }
  }

  const handleApproveVendor = async (registrationId: number) => {
    try {
      const response = await fetch('/api/admin/campaigns/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          status: 'approved',
          type: 'vendor',
          approvedBy: parseInt(localStorage.getItem('userId') || '1'),
        }),
      })

      if (!response.ok) throw new Error('Failed to approve')

      toast({
        title: 'Thành công',
        description: 'Duyệt đăng ký vendor thành công',
      })

      fetchVendorRegistrations()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể duyệt đăng ký',
        variant: 'destructive',
      })
    }
  }

  const handleRejectVendor = async (registrationId: number) => {
    try {
      const response = await fetch('/api/admin/campaigns/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          status: 'rejected',
          type: 'vendor',
          rejectionReason: 'Rejected by admin',
        }),
      })

      if (!response.ok) throw new Error('Failed to reject')

      toast({
        title: 'Thành công',
        description: 'Từ chối đăng ký vendor thành công',
      })

      fetchVendorRegistrations()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể từ chối đăng ký',
        variant: 'destructive',
      })
    }
  }

  const handleApproveProduct = async (registrationId: number) => {
    try {
      const response = await fetch('/api/admin/campaigns/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          status: 'approved',
          type: 'product',
          approvedBy: parseInt(localStorage.getItem('userId') || '1'),
        }),
      })

      if (!response.ok) throw new Error('Failed to approve')

      toast({
        title: 'Thành công',
        description: 'Duyệt sản phẩm thành công',
      })

      fetchProductRegistrations()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể duyệt sản phẩm',
        variant: 'destructive',
      })
    }
  }

  const handleRejectProduct = async (registrationId: number) => {
    try {
      const response = await fetch('/api/admin/campaigns/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          status: 'rejected',
          type: 'product',
          rejectionReason: 'Rejected by admin',
        }),
      })

      if (!response.ok) throw new Error('Failed to reject')

      toast({
        title: 'Thành công',
        description: 'Từ chối sản phẩm thành công',
      })

      fetchProductRegistrations()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể từ chối sản phẩm',
        variant: 'destructive',
      })
    }
  }

  if (loading) return <div className="p-6 text-center">Đang tải...</div>

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Quản lý chương trình khuyễn mãi</h1>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setEditingCampaign(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo chương trình
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCampaign ? 'Cập nhật' : 'Tạo'} chương trình khuyễn mãi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tên chương trình</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên chương trình"
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả"
                />
              </div>
              <div>
                <Label>Loại chương trình</Label>
                <Select value={formData.campaignType} onValueChange={(value) => setFormData({ ...formData, campaignType: value as 'regular' | 'flash_sale' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Khuyến mãi thường</SelectItem>
                    <SelectItem value="flash_sale">Flash Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loại giảm giá</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as 'percentage' | 'fixed' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                      <SelectItem value="fixed">Giảm trực tiếp (VND)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Giá trị giảm</Label>
                  <Input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ngày bắt đầu</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ngày kết thúc</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              {formData.campaignType === 'flash_sale' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Giờ bắt đầu (mỗi ngày)</Label>
                    <Input
                      type="time"
                      value={formData.flashSaleStartTime}
                      onChange={(e) => setFormData({ ...formData, flashSaleStartTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Giờ kết thúc (mỗi ngày)</Label>
                    <Input
                      type="time"
                      value={formData.flashSaleEndTime}
                      onChange={(e) => setFormData({ ...formData, flashSaleEndTime: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Trạng thái</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as CampaignStatus })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Khởi tạo</SelectItem>
                      <SelectItem value="upcoming">Sắp diễn ra</SelectItem>
                      <SelectItem value="active">Đang diễn ra</SelectItem>
                      <SelectItem value="ended">Kết thúc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Ngân sách (tùy chọn)</Label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0"
                />
              </div>
              <Button onClick={handleSaveCampaign} className="w-full">
                {editingCampaign ? 'Cập nhật' : 'Tạo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Chương trình khuyến mãi ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="products">Đăng ký sản phẩm ({productRegistrations.length})</TabsTrigger>
          <TabsTrigger value="approved">Sản phẩm đã duyệt ({approvedProducts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách chương trình khuyễn mãi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Tên chương trình</th>
                      <th className="text-left py-3 px-4">Loại CT</th>
                      <th className="text-left py-3 px-4">Loại giảm giá</th>
                      <th className="text-left py-3 px-4">Giảm giá</th>
                      <th className="text-left py-3 px-4">Từ ngày</th>
                      <th className="text-left py-3 px-4">Đến ngày</th>
                      <th className="text-left py-3 px-4">Trạng thái</th>
                      <th className="text-left py-3 px-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b border-border hover:bg-muted">
                        <td className="py-3 px-4 font-medium">{campaign.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            campaign.campaignType === 'flash_sale' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {campaign.campaignType === 'flash_sale' ? 'Flash Sale' : 'Thường'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{campaign.type === 'percentage' ? 'Phần trăm' : 'Giảm trực tiếp'}</td>
                        <td className="py-3 px-4">
                          {campaign.discountValue}
                          {campaign.type === 'percentage' ? '%' : ' VND'}
                        </td>
                        <td className="py-3 px-4">{new Date(campaign.startDate).toLocaleDateString('vi-VN')}</td>
                        <td className="py-3 px-4">{new Date(campaign.endDate).toLocaleDateString('vi-VN')}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${campaignStatusStyle[campaign.status]}`}
                          >
                            {campaignStatusLabel[campaign.status]}
                          </span>
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          <Edit
                            className="h-4 w-4 cursor-pointer text-orange-600"
                            onClick={() => {
                              setEditingCampaign(campaign)
                              setFormData({
                                name: campaign.name,
                                description: campaign.description || '',
                                type: campaign.type,
                                discountValue: campaign.discountValue,
                                campaignType: campaign.campaignType || 'regular',
                                startDate: new Date(campaign.startDate).toISOString().slice(0, 16),
                                endDate: new Date(campaign.endDate).toISOString().slice(0, 16),
                                flashSaleStartTime: campaign.flashSaleStartTime || '',
                                flashSaleEndTime: campaign.flashSaleEndTime || '',
                                budget: campaign.budget?.toString() || '',
                                status: campaign.status,
                              })
                              setOpenDialog(true)
                            }}
                          />
                          <Trash2 className="h-4 w-4 cursor-pointer text-red-600" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Đơn đăng ký sản phẩm vào chương trình khuyễn mãi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Chương trình</th>
                      <th className="text-left py-3 px-4">Sản phẩm</th>
                      <th className="text-left py-3 px-4">Vendor (theo vendorId)</th>
                      <th className="text-left py-3 px-4">Số lượng</th>
                      <th className="text-left py-3 px-4">Ngày đăng ký</th>
                      <th className="text-left py-3 px-4">Trạng thái</th>
                      <th className="text-left py-3 px-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          Không có sản phẩm chờ duyệt
                        </td>
                      </tr>
                    ) : (
                      productRegistrations.map((reg) => (
                        <tr key={reg.id} className="border-b border-border hover:bg-muted">
                          <td className="py-3 px-4 font-medium">{reg.Campaign.name}</td>
                          <td className="py-3 px-4">{reg.Product.name}</td>
                          <td className="py-3 px-4">{reg.Vendor.name}</td>
                          <td className="py-3 px-4">{reg.quantity}</td>
                          <td className="py-3 px-4">{new Date(reg.registeredAt).toLocaleDateString('vi-VN')}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                              Chờ duyệt
                            </span>
                          </td>
                          <td className="py-3 px-4 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                setSelectedRegistration(reg)
                                setDetailOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleApproveProduct(reg.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleRejectProduct(reg.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm đã duyệt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Chương trình</th>
                      <th className="text-left py-3 px-4">Sản phẩm</th>
                      <th className="text-left py-3 px-4">Vendor</th>
                      <th className="text-left py-3 px-4">Số lượng</th>
                      <th className="text-left py-3 px-4">Ngày duyệt</th>
                      <th className="text-left py-3 px-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          Chưa có sản phẩm đã duyệt
                        </td>
                      </tr>
                    ) : (
                      approvedProducts.map((reg) => (
                        <tr key={reg.id} className="border-b border-border hover:bg-muted">
                          <td className="py-3 px-4 font-medium">{reg.Campaign.name}</td>
                          <td className="py-3 px-4">
                            {reg.Product.name}
                            {reg.ProductVariant && ` - ${reg.ProductVariant.name}`}
                          </td>
                          <td className="py-3 px-4">{reg.Vendor.name}</td>
                          <td className="py-3 px-4">{reg.quantity}</td>
                          <td className="py-3 px-4">
                            {reg.approvedAt ? new Date(reg.approvedAt).toLocaleDateString('vi-VN') : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              Đã duyệt
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết đăng ký sản phẩm</DialogTitle>
          </DialogHeader>
          {selectedRegistration ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Chương trình:</span> {selectedRegistration.Campaign.name}</p>
              <p><span className="font-medium">Vendor:</span> {selectedRegistration.Vendor.name} (ID: {selectedRegistration.vendorId})</p>
              <p><span className="font-medium">Sản phẩm:</span> {selectedRegistration.Product.name}</p>
              {selectedRegistration.ProductVariant && (
                <p><span className="font-medium">Variant:</span> {selectedRegistration.ProductVariant.name}</p>
              )}
              <p><span className="font-medium">Số lượng đăng ký:</span> {selectedRegistration.quantity}</p>
              <p><span className="font-medium">Ngày đăng ký:</span> {new Date(selectedRegistration.registeredAt).toLocaleString('vi-VN')}</p>
              <p><span className="font-medium">Trạng thái:</span> {selectedRegistration.status}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
