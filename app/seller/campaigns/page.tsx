"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useLoading } from "@/hooks/use-loading"
import { useRouter } from "next/navigation"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/pagination"

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

const registerableStatuses: CampaignStatus[] = ['draft', 'upcoming']

interface Campaign {
  id: number
  name: string
  description?: string
  type: 'percentage' | 'fixed'
  discountValue: number
  campaignType?: 'regular' | 'flash_sale'
  startDate: string
  endDate: string
  status: CampaignStatus
  registrationStatus?: 'pending' | 'approved' | 'rejected'
  isRegistered?: boolean
  canRegister?: boolean
}

interface SellerProduct {
  id: number
  name: string
  price: number
  stock: number
  ProductVariant: Array<{
    id: number
    name: string
    price: number
    stock: number
  }>
}

interface VendorRegistration {
  id: number
  campaignId: number
  vendorId: number
  status: 'pending' | 'approved' | 'rejected'
  registeredAt: string
  approvedAt?: string
  rejectionReason?: string
}

interface CampaignProduct {
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
  Product: { id: number; name: string; slug: string; price: number }
  ProductVariant?: { id: number; name: string; price: number }
}

export default function SellerCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [registeredCampaigns, setRegisteredCampaigns] = useState<Campaign[]>([])
  const [campaignProducts, setCampaignProducts] = useState<Map<number, CampaignProduct[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [vendorId, setVendorId] = useState<number | null>(null)
  const [selectedCampaignForProducts, setSelectedCampaignForProducts] = useState<number | null>(null)
  const [products, setProducts] = useState<SellerProduct[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const { toast } = useToast()
  const { user } = useAuth()
  const { setIsLoading } = useLoading()
  const router = useRouter()
  const pagination = usePagination({ initialPage: 1, initialLimit: 20 })

  useEffect(() => {
    fetchData()
  }, [user, pagination.page, pagination.limit, activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (!vendorId && !user?.vendorId) return
      
      const vid = vendorId || user?.vendorId
      if (!vid) return

      // Determine campaign type based on active tab
      let campaignType = 'all'
      if (activeTab === 'available') campaignType = 'available'
      if (activeTab === 'registered') campaignType = 'registered'

      // Fetch campaigns with pagination
      const url = new URL('/api/seller/campaigns', typeof window !== 'undefined' ? window.location.origin : '')
      url.searchParams.append('vendorId', vid.toString())
      url.searchParams.append('type', campaignType)
      url.searchParams.append('limit', pagination.limit.toString())
      url.searchParams.append('offset', pagination.offset.toString())

      const campaignsResponse = await fetch(url.toString())
      const campaignsData = await campaignsResponse.json()
      
      if (campaignsData.campaigns) {
        if (activeTab === 'available') {
          const available = campaignsData.campaigns.filter((c: Campaign) => {
            const canRegister = c.canRegister ?? registerableStatuses.includes(c.status)
            return !c.isRegistered && canRegister
          })
          setCampaigns(available)
        } else if (activeTab === 'registered') {
          const registered = campaignsData.campaigns.filter((c: Campaign) => c.isRegistered)
          setRegisteredCampaigns(registered)
        } else {
          setCampaigns(campaignsData.campaigns)
        }
        pagination.setTotal(campaignsData.pagination?.total || 0)
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách chương trình',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setIsLoading(false)
    }
  }

  const handleOpenJoin = (campaignId: number) => {
    router.push(`/seller/campaigns/${campaignId}/products`)
  }

  const handleViewProducts = async (campaignId: number, force?: boolean) => {
    if (!force && selectedCampaignForProducts === campaignId) {
      setSelectedCampaignForProducts(null)
      return
    }

    if (!vendorId) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/seller/campaigns/products?campaignId=${campaignId}&vendorId=${vendorId}`)
      const products = await response.json()
      
      campaignProducts.set(campaignId, products)
      setCampaignProducts(new Map(campaignProducts))
      setSelectedCampaignForProducts(campaignId)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách sản phẩm',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveProduct = async (campaignProductId: number) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/seller/campaigns/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignProductId }),
      })

      if (!response.ok) throw new Error('Failed to remove')

      toast({
        title: 'Thành công',
        description: 'Xóa sản phẩm khỏi chương trình thành công',
      })

      if (selectedCampaignForProducts) {
        handleViewProducts(selectedCampaignForProducts, true)
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa sản phẩm',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) return <div className="p-6 text-center">Đang tải...</div>

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Quản lý chương trình khuyễn mãi</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        pagination.setPage(1)
      }}>
        <TabsList>
          <TabsTrigger value="available">Chương trình có sẵn</TabsTrigger>
          <TabsTrigger value="registered">Đã đăng ký</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <div className="grid gap-4">
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Không có chương trình khuyễn mãi nào để đăng ký</p>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{campaign.name}</CardTitle>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground mt-2">{campaign.description}</p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-4 ${campaignStatusStyle[campaign.status]}`}
                      >
                        {campaignStatusLabel[campaign.status]}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!(campaign.canRegister ?? registerableStatuses.includes(campaign.status)) && (
                      <p className="text-sm text-red-600 mb-2">
                        Trạng thái hiện tại không cho phép đăng ký thêm.
                      </p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Loại chương trình</p>
                        <p className="font-semibold">{campaign.campaignType === 'flash_sale' ? 'Flash Sale' : 'Khuyến mãi thường'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Loại giảm giá</p>
                        <p className="font-semibold">{campaign.type === 'percentage' ? 'Phần trăm' : 'Giảm trực tiếp'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Giá trị giảm</p>
                        <p className="font-semibold text-lg text-green-600">
                          {campaign.discountValue}
                          {campaign.type === 'percentage' ? '%' : ' VND'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Từ ngày</p>
                        <p className="font-semibold">{new Date(campaign.startDate).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Đến ngày</p>
                        <p className="font-semibold">{new Date(campaign.endDate).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleOpenJoin(campaign.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!(campaign.canRegister ?? registerableStatuses.includes(campaign.status))}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tham gia & đăng ký sản phẩm
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {campaigns.length > 0 && (
            <div className="mt-6">
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
        </TabsContent>

        <TabsContent value="registered">
          <div className="grid gap-4">
            {registeredCampaigns.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Bạn chưa đăng ký chương trình nào</p>
                </CardContent>
              </Card>
            ) : (
              registeredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{campaign.name}</CardTitle>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground mt-2">{campaign.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                          campaign.registrationStatus === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : campaign.registrationStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {campaign.registrationStatus === 'approved'
                            ? 'Đã duyệt'
                            : campaign.registrationStatus === 'pending'
                            ? 'Chờ duyệt'
                            : 'Bị từ chối'}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${campaignStatusStyle[campaign.status]}`}
                        >
                          {campaignStatusLabel[campaign.status]}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Loại chương trình</p>
                        <p className="font-semibold">{campaign.campaignType === 'flash_sale' ? 'Flash Sale' : 'Khuyến mãi thường'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Loại giảm giá</p>
                        <p className="font-semibold">{campaign.type === 'percentage' ? 'Phần trăm' : 'Giảm trực tiếp'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Giá trị giảm</p>
                        <p className="font-semibold text-lg text-green-600">
                          {campaign.discountValue}
                          {campaign.type === 'percentage' ? '%' : ' VND'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Từ ngày</p>
                        <p className="font-semibold">{new Date(campaign.startDate).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Đến ngày</p>
                        <p className="font-semibold">{new Date(campaign.endDate).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewProducts(campaign.id)}
                        variant="outline"
                        className="flex-1"
                      >
                        {selectedCampaignForProducts === campaign.id ? 'Ẩn sản phẩm' : 'Quản lý sản phẩm'}
                        <ChevronRight className={`h-4 w-4 ml-2 transition-transform ${selectedCampaignForProducts === campaign.id ? 'rotate-90' : ''}`} />
                      </Button>
                      <Link
                        href={`/seller/campaigns/${campaign.id}/products`}
                        className="flex-1"
                      >
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm sản phẩm
                        </Button>
                      </Link>
                    </div>

                    {selectedCampaignForProducts === campaign.id && (
                      <div className="mt-6 border-t pt-4">
                        <h3 className="font-semibold mb-4">Sản phẩm trong chương trình</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-3 px-4">Sản phẩm</th>
                                <th className="text-left py-3 px-4">Số lượng đăng ký</th>
                                <th className="text-left py-3 px-4">Đã bán</th>
                                <th className="text-left py-3 px-4">Trạng thái</th>
                                <th className="text-left py-3 px-4">Hành động</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(campaignProducts.get(campaign.id) || []).length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                    Chưa có sản phẩm nào trong chương trình này
                                  </td>
                                </tr>
                              ) : (
                                (campaignProducts.get(campaign.id) || []).map((product) => (
                                  <tr key={product.id} className="border-b border-border hover:bg-muted">
                                    <td className="py-3 px-4 font-medium">{product.Product.name}</td>
                                    <td className="py-3 px-4">{product.quantity}</td>
                                    <td className="py-3 px-4">{product.purchasedQuantity}</td>
                                    <td className="py-3 px-4">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        product.status === 'approved'
                                          ? 'bg-green-100 text-green-800'
                                          : product.status === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {product.status === 'approved'
                                          ? 'Đã duyệt'
                                          : product.status === 'pending'
                                          ? 'Chờ duyệt'
                                          : 'Bị từ chối'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => handleRemoveProduct(product.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {registeredCampaigns.length > 0 && (
            <div className="mt-6">
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

        </TabsContent>
      </Tabs>
    </main>
  )
}
