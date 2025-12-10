"use client"

import { useState, useEffect } from "react"
import { Save, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VendorApprovalBanner } from "@/components/vendor-approval-banner"
import { ProductImageUpload } from "@/components/product-image-upload"
import { useToast } from "@/hooks/use-toast"

interface ShopData {
  shopName: string
  shopLogo: string
  vendorLogo: string
  shopDescription: string
  ownerName: string
  email: string
  phone: string
  address: string
  taxId: string
  businessLicense: string
  bankAccount: string
  bankName: string
  bankBranch: string
}

interface PolicyData {
  returnPolicy: string
  privacyPolicy: string
}

interface ShippingData {
  defaultMethod: string
  processingTime: string
}

interface PaymentData {
  bankTransfer: boolean
  e_wallet: boolean
}

export default function SellerSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [shopData, setShopData] = useState<ShopData>({
    shopName: '',
    shopLogo: '',
    vendorLogo: '',
    shopDescription: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    businessLicense: '',
    bankAccount: '',
    bankName: '',
    bankBranch: '',
  })

  const [policyData, setPolicyData] = useState<PolicyData>({
    returnPolicy: '',
    privacyPolicy: '',
  })

  const [shippingData, setShippingData] = useState<ShippingData>({
    defaultMethod: 'standard',
    processingTime: '24',
  })

  const [paymentData, setPaymentData] = useState<PaymentData>({
    bankTransfer: true,
    e_wallet: false,
  })

  useEffect(() => {
    fetchShopSettings()
  }, [])

  const fetchShopSettings = async () => {
    try {
      const response = await fetch('/api/seller/vendor')
      if (!response.ok) throw new Error('Failed to fetch vendor settings')
      
      const data = await response.json()
      const vendor = data.vendor
      const user = data.user
      const userProfile = data.userProfile
      
      console.log('Fetched vendor data:', { vendor, user, userProfile })
      
      setShopData(prev => ({
        ...prev,
        shopName: vendor?.name || '',
        shopLogo: vendor?.coverImage || '',
        vendorLogo: vendor?.logo || userProfile?.avatar || '',
        shopDescription: vendor?.description || '',
        ownerName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: vendor?.businessAddress || '',
        taxId: vendor?.taxId || '',
        businessLicense: vendor?.businessLicense || '',
        bankAccount: vendor?.bankAccount || '',
        bankName: vendor?.bankName || '',
        bankBranch: vendor?.bankBranch || '',
      }))
    } catch (error) {
      console.error('Error fetching vendor settings:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải cài đặt vendor",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGeneral = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/seller/vendor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopData),
      })

      if (!response.ok) throw new Error('Failed to save')

      toast({
        title: "Thành công",
        description: "Thông tin chung đã được cập nhật",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu thông tin",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePolicy = async () => {
    setSaving(true)
    try {
      toast({
        title: "Thành công",
        description: "Chính sách đã được cập nhật",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu chính sách",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveShipping = async () => {
    setSaving(true)
    try {
      toast({
        title: "Thành công",
        description: "Cài đặt vận chuyển đã được cập nhật",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu cài đặt vận chuyển",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePayment = async () => {
    setSaving(true)
    try {
      toast({
        title: "Thành công",
        description: "Cài đặt thanh toán đã được cập nhật",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu cài đặt thanh toán",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="p-6">
        <div className="flex items-center justify-center h-96">
          <Loader className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </main>
    )
  }

  return (
    <main className="p-6">
      <VendorApprovalBanner />
      <h1 className="text-3xl font-bold mb-8">Cài đặt shop</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="policy">Chính sách</TabsTrigger>
          <TabsTrigger value="shipping">Vận chuyển</TabsTrigger>
          <TabsTrigger value="payment">Thanh toán</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin shop</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Logo vendor (Avatar chủ shop)</Label>
                <div className="mt-2 space-y-4">
                  {shopData.vendorLogo && (
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24">
                        <img src={shopData.vendorLogo} alt="vendor logo" className="w-24 h-24 object-cover rounded-full border-2 border-gray-200" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Logo hiện tại</p>
                        <button
                          type="button"
                          onClick={() => setShopData(prev => ({ ...prev, vendorLogo: '' }))}
                          className="text-sm text-orange-600 hover:text-orange-700 underline"
                        >
                          Đổi logo
                        </button>
                      </div>
                    </div>
                  )}
                  <ProductImageUpload
                    onImageSelect={(url) => setShopData(prev => ({ ...prev, vendorLogo: url }))}
                  />
                </div>
              </div>

              <div>
                <Label>Ảnh bìa shop</Label>
                <div className="mt-2 space-y-4">
                  {shopData.shopLogo && (
                    <div className="relative w-full">
                      <img src={shopData.shopLogo} alt="shop cover" className="w-full h-40 object-cover rounded border border-gray-200" />
                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={() => setShopData(prev => ({ ...prev, shopLogo: '' }))}
                          className="bg-white hover:bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm"
                        >
                          Đổi ảnh
                        </button>
                      </div>
                    </div>
                  )}
                  <ProductImageUpload
                    onImageSelect={(url) => setShopData(prev => ({ ...prev, shopLogo: url }))}
                  />
                </div>
              </div>

              <div>
                <Label>Tên shop</Label>
                <Input 
                  value={shopData.shopName}
                  onChange={(e) => setShopData(prev => ({ ...prev, shopName: e.target.value }))}
                  className="mt-2"
                  placeholder="Nhập tên shop"
                />
              </div>

              <div>
                <Label>Mô tả shop</Label>
                <textarea 
                  value={shopData.shopDescription}
                  onChange={(e) => setShopData(prev => ({ ...prev, shopDescription: e.target.value }))}
                  className="w-full mt-2 p-2 border rounded text-sm" 
                  rows={4}
                  placeholder="Nhập mô tả shop"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email liên hệ</Label>
                  <Input 
                    type="email"
                    value={shopData.email}
                    onChange={(e) => setShopData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-2"
                    placeholder="Nhập email"
                  />
                </div>
                <div>
                  <Label>Số điện thoại</Label>
                  <Input 
                    value={shopData.phone}
                    onChange={(e) => setShopData(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-2"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              <div>
                <Label>Địa chỉ</Label>
                <Input 
                  value={shopData.address}
                  onChange={(e) => setShopData(prev => ({ ...prev, address: e.target.value }))}
                  className="mt-2"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mã số thuế</Label>
                  <Input 
                    value={shopData.taxId}
                    onChange={(e) => setShopData(prev => ({ ...prev, taxId: e.target.value }))}
                    className="mt-2"
                    placeholder="Nhập mã số thuế"
                  />
                </div>
                <div>
                  <Label>Số giấy phép kinh doanh</Label>
                  <Input 
                    value={shopData.businessLicense}
                    onChange={(e) => setShopData(prev => ({ ...prev, businessLicense: e.target.value }))}
                    className="mt-2"
                    placeholder="Nhập số giấy phép"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tên chủ shop</Label>
                  <Input 
                    value={shopData.ownerName}
                    onChange={(e) => setShopData(prev => ({ ...prev, ownerName: e.target.value }))}
                    className="mt-2"
                    placeholder="Nhập tên chủ shop"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveGeneral} 
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy">
          <Card>
            <CardHeader>
              <CardTitle>Chính sách shop</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Chính sách đổi trả</Label>
                <textarea 
                  value={policyData.returnPolicy}
                  onChange={(e) => setPolicyData(prev => ({ ...prev, returnPolicy: e.target.value }))}
                  className="w-full mt-2 p-2 border rounded text-sm" 
                  rows={4}
                  placeholder="Nhập chính sách đổi trả"
                ></textarea>
              </div>

              <div>
                <Label>Chính sách bảo mật</Label>
                <textarea 
                  value={policyData.privacyPolicy}
                  onChange={(e) => setPolicyData(prev => ({ ...prev, privacyPolicy: e.target.value }))}
                  className="w-full mt-2 p-2 border rounded text-sm" 
                  rows={4}
                  placeholder="Nhập chính sách bảo mật"
                ></textarea>
              </div>

              <Button 
                onClick={handleSavePolicy} 
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt vận chuyển</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Phương thức giao hàng mặc định</Label>
                <select 
                  value={shippingData.defaultMethod}
                  onChange={(e) => setShippingData(prev => ({ ...prev, defaultMethod: e.target.value }))}
                  className="w-full mt-2 p-2 border rounded"
                >
                  <option value="standard">Giao hàng tiêu chuẩn</option>
                  <option value="express">Giao hàng express</option>
                </select>
              </div>

              <div>
                <Label>Thời gian xử lý đơn hàng (giờ)</Label>
                <Input 
                  type="number" 
                  value={shippingData.processingTime}
                  onChange={(e) => setShippingData(prev => ({ ...prev, processingTime: e.target.value }))}
                  className="mt-2"
                  min="1"
                  max="168"
                />
              </div>

              <Button 
                onClick={handleSaveShipping} 
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="cod" 
                  disabled 
                  defaultChecked
                />
                <Label htmlFor="cod">Thanh toán khi nhận hàng (COD)</Label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="bankTransfer"
                  checked={paymentData.bankTransfer}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, bankTransfer: e.target.checked }))}
                />
                <Label htmlFor="bankTransfer">Chuyển khoản ngân hàng</Label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="e_wallet"
                  checked={paymentData.e_wallet}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, e_wallet: e.target.checked }))}
                />
                <Label htmlFor="e_wallet">Ví điện tử</Label>
              </div>

              <Button 
                onClick={handleSavePayment} 
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 mt-4"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
