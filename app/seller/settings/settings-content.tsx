"use client"

import { useState, useEffect, useRef } from "react"
import { Save, Loader, ImageIcon, Pencil, Store, Upload, CheckCircle2, X, Check, ChevronsUpDown, Landmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { VendorApprovalBanner } from "@/components/vendor-approval-banner"
import { useToast } from "@/hooks/use-toast"
import { useLoading } from "@/hooks/use-loading"

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
  bankCode: string
  bankBin: string
  bankBranch: string
  walletProvider: string
  walletAccount: string
  walletQrUrl: string
}

interface PolicyData {
  returnPolicy: string
  privacyPolicy: string
}

interface ShippingData {
  defaultMethod: string
  processingTime: string
}

function BrandAssetControl({
  label,
  helper,
  imageUrl,
  uploadType,
  onUploaded,
  cover = false,
}: {
  label: string
  helper: string
  imageUrl: string
  uploadType: "logo" | "cover"
  onUploaded: (url: string) => void
  cover?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selecting, setSelecting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const uploadFile = async (file?: File) => {
    if (!file) return
    setError("")
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Dung lượng ảnh tối đa là 5MB.")
      return
    }

    setUploading(true)
    try {
      const body = new FormData()
      body.append("file", file)
      body.append("uploadType", uploadType)
      const response = await fetch("/api/seller/vendor-upload", { method: "POST", body })
      if (!response.ok) throw new Error("Upload thất bại")
      const data = await response.json()
      onUploaded(data.url)
      setSelecting(false)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Không thể tải ảnh lên.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className={cover ? "relative z-20 rounded-xl border border-slate-200 bg-white p-3 sm:p-4" : "rounded-xl border border-slate-200 bg-white p-4"}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div><Label className="font-semibold text-slate-900">{label}</Label><p className="mt-1 text-xs text-muted-foreground">{helper}</p></div>
        {imageUrl && <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Đang dùng</span>}
      </div>
      {imageUrl ? (
        <div className={cover ? "relative" : "flex items-center gap-4"}>
          <img src={imageUrl} alt={`${label} hiện tại`} className={cover ? "aspect-[16/5] w-full rounded-lg border border-slate-200 bg-slate-100 object-cover" : "h-20 w-20 rounded-xl border border-slate-200 bg-white object-cover p-1"} />
          {!cover && <div><p className="text-sm font-medium text-slate-900">Logo hiện tại</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Đây là ảnh đại diện công khai của shop.</p></div>}
        </div>
      ) : (
        <div className={cover ? "flex aspect-[16/5] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-muted-foreground" : "flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-muted-foreground"}><ImageIcon className="h-5 w-5" /></div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-xs text-muted-foreground">{imageUrl ? "Ảnh đang hiển thị trên trang shop." : "Chưa có ảnh hiển thị."}</p>
        {!selecting && <Button type="button" variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800" onClick={() => setSelecting(true)}><Pencil className="mr-1.5 h-3.5 w-3.5" />{imageUrl ? "Thay ảnh" : "Chọn ảnh"}</Button>}
      </div>
      {selecting && <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50/60 p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-slate-800">Chọn ảnh thay thế</p><button type="button" className="text-slate-500 hover:text-slate-800" onClick={() => { setSelecting(false); setError("") }} aria-label="Hủy chọn ảnh"><X className="h-4 w-4" /></button></div><p className="mt-1 text-xs text-muted-foreground">Ảnh hiện tại vẫn được giữ cho tới khi tải ảnh mới thành công.</p><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => uploadFile(event.target.files?.[0])} /><Button type="button" size="sm" disabled={uploading} className="mt-3 bg-orange-600 hover:bg-orange-700" onClick={() => inputRef.current?.click()}>{uploading ? <><Loader className="mr-1.5 h-3.5 w-3.5 animate-spin" />Đang tải lên...</> : <><Upload className="mr-1.5 h-3.5 w-3.5" />Chọn tệp ảnh</>}</Button>{error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}</div>}
    </div>
  )
}

const WALLET_PROVIDERS = [
  "MoMo",
  "ZaloPay",
  "ShopeePay",
  "VNPay",
  "Viettel Money",
  "Payoo",
  "Moca",
  "AirPay",
  "VTC Pay",
  "Vimo",
] as const

interface VietQrBank {
  bin: string
  code: string
  shortName: string
  name: string
  logo?: string
}

function BankLogo({ bank, size = "lg" }: { bank?: VietQrBank; size?: "sm" | "lg" }) {
  const [failed, setFailed] = useState(false)
  const dimensions = size === "sm" ? "h-10 w-10" : "h-10 w-10"

  useEffect(() => setFailed(false), [bank?.logo])

  if (!bank?.logo || failed) {
    return <span aria-label={bank ? `Biểu tượng ${bank.shortName}` : "Biểu tượng ngân hàng"} className={`${dimensions} inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400`}><Landmark className="h-5 w-5" aria-hidden="true" /></span>
  }

  return <span className={`${dimensions} inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white p-0.5`}><img src={bank.logo} alt={`Logo ${bank.shortName}`} className="h-full w-full object-contain" onError={() => setFailed(true)} /></span>
}

function BankPicker({
  banks,
  selectedBin,
  selectedName,
  loading,
  onSelect,
}: {
  banks: VietQrBank[]
  selectedBin: string
  selectedName: string
  loading: boolean
  onSelect: (bank: VietQrBank) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)")
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN")
  const matchingBanks = banks.filter((bank) =>
    [bank.shortName, bank.name, bank.code, bank.bin]
      .some((value) => value.toLocaleLowerCase("vi-VN").includes(normalizedQuery)),
  )
  const selectedBank = banks.find((bank) => bank.bin === selectedBin)
  const selectedLabel = selectedBank
    ? `${selectedBank.shortName} — ${selectedBank.name}`
    : selectedName
      ? selectedName
      : "Chọn ngân hàng"

  const choose = (bank: VietQrBank) => {
    onSelect(bank)
    setOpen(false)
    setQuery("")
  }

  const pickerContent = (
    <Command className="rounded-lg" shouldFilter={false}>
      <CommandInput value={query} onValueChange={setQuery} placeholder="Tìm tên, mã ngân hàng hoặc BIN..." />
      <CommandList className="max-h-[min(19rem,calc(100vh-13rem))] sm:max-h-72">
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground"><Loader className="h-4 w-4 animate-spin" />Đang tải danh sách ngân hàng...</div>
        ) : (
          <>
            <CommandEmpty>Không tìm thấy ngân hàng phù hợp.</CommandEmpty>
            <CommandGroup heading={`${matchingBanks.length} ngân hàng`}>
              {matchingBanks.map((bank) => (
                <CommandItem key={bank.bin} value={`${bank.shortName} ${bank.name} ${bank.code} ${bank.bin}`} onSelect={() => choose(bank)} className={`min-h-[3.5rem] py-1.5 ${selectedBin === bank.bin ? "bg-blue-50/80 text-slate-900" : ""}`}>
                  <Check className={`h-4 w-4 shrink-0 ${selectedBin === bank.bin ? "opacity-100 text-blue-600" : "opacity-0"}`} />
                  <BankLogo bank={bank} size="sm" />
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{bank.shortName} <span className="font-normal text-muted-foreground">— {bank.name}</span></span></span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )

  const trigger = (
    <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="mt-2 h-12 w-full justify-between gap-2 px-3 text-left font-normal hover:bg-slate-50" disabled={loading}>
      <span className="flex min-w-0 flex-1 items-center gap-2">{!loading && <BankLogo bank={selectedBank} />}<span className="truncate">{loading ? "Đang tải danh sách ngân hàng..." : selectedLabel}</span></span>
      <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Button>
  )

  if (isMobile) {
    return <Dialog open={open} onOpenChange={setOpen}><Button type="button" variant="outline" role="combobox" aria-expanded={open} className="mt-2 h-12 w-full justify-between gap-2 px-3 text-left font-normal hover:bg-slate-50" disabled={loading} onClick={() => setOpen(true)}><span className="flex min-w-0 flex-1 items-center gap-2">{!loading && <BankLogo bank={selectedBank} />}<span className="truncate">{loading ? "Đang tải danh sách ngân hàng..." : selectedLabel}</span></span><ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" /></Button><DialogContent className="top-auto bottom-0 max-h-[82dvh] w-full max-w-none translate-x-0 translate-y-0 rounded-t-2xl p-0 sm:top-[50%] sm:bottom-auto sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%]"><DialogHeader className="border-b px-4 py-4"><DialogTitle>Chọn ngân hàng</DialogTitle></DialogHeader><div className="p-2">{pickerContent}</div></DialogContent></Dialog>
  }

  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild>{trigger}</PopoverTrigger><PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[22rem] p-1">{pickerContent}</PopoverContent></Popover>
}

export default function SellerSettingsPage() {
  const { toast } = useToast()
  const { setIsLoading } = useLoading()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [banks, setBanks] = useState<VietQrBank[]>([])
  const [banksError, setBanksError] = useState("")

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
    bankCode: '',
    bankBin: '',
    bankBranch: '',
    walletProvider: '',
    walletAccount: '',
    walletQrUrl: '',
  })

  const [policyData, setPolicyData] = useState<PolicyData>({
    returnPolicy: '',
    privacyPolicy: '',
  })

  const [shippingData, setShippingData] = useState<ShippingData>({
    defaultMethod: 'standard',
    processingTime: '24',
  })

  useEffect(() => {
    fetchShopSettings()
    fetchBanks()
  }, [])

  const fetchBanks = async () => {
    try {
      setBanksError("")
      const response = await fetch('/api/banks')
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không thể tải danh sách ngân hàng.')
      setBanks(Array.isArray(result.data) ? result.data : [])
    } catch (error) {
      setBanksError(error instanceof Error ? error.message : 'Không thể tải danh sách ngân hàng.')
    }
  }

  const fetchShopSettings = async () => {
    try {
      setIsLoading(true)
      setLoading(true)
      const response = await fetch('/api/seller/vendor')
      if (!response.ok) throw new Error('Failed to fetch vendor settings')
      
      const data = await response.json()
      const vendor = data.vendor
      const user = data.user
      const userProfile = data.userProfile
      const shopDetail = data.shopDetail
      
      console.log('Fetched vendor data:', { vendor, user, userProfile, shopDetail })
      
      setShopData(prev => ({
        ...prev,
        shopName: vendor?.name || '',
        shopLogo: vendor?.coverImage || '',
        vendorLogo: vendor?.logo || userProfile?.avatar || '',
        shopDescription: vendor?.description || '',
        ownerName: shopDetail?.ownerName || user?.name || '',
        email: shopDetail?.email || user?.email || '',
        phone: shopDetail?.phone || user?.phone || '',
        address: shopDetail?.address || vendor?.businessAddress || '',
        taxId: shopDetail?.taxId || vendor?.taxId || '',
        businessLicense: shopDetail?.businessLicense || vendor?.businessLicense || '',
        bankAccount: vendor?.bankAccount || shopDetail?.bankAccount || '',
        bankName: vendor?.bankName || shopDetail?.bankName || '',
        bankCode: vendor?.bankCode || '',
        bankBin: vendor?.bankBin || '',
        bankBranch: shopDetail?.bankBranch || vendor?.bankBranch || '',
        walletProvider: vendor?.walletProvider || '',
        walletAccount: vendor?.walletAccount || '',
        walletQrUrl: vendor?.walletQrUrl || '',
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
      setIsLoading(false)
    }
  }

  const handleSaveGeneral = async () => {
    setSaving(true)
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const handleSavePolicy = async () => {
    setSaving(true)
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const handleSaveShipping = async () => {
    setSaving(true)
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const handleSavePayment = async () => {
    setSaving(true)
    setIsLoading(true)
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
      setIsLoading(false)
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
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <VendorApprovalBanner />
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Thiết lập cửa hàng</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Cài đặt shop</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cập nhật nhận diện và thông tin hiển thị công khai của cửa hàng.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-5 h-auto w-full justify-start overflow-x-auto rounded-lg bg-slate-100 p-1 sm:w-fit">
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="policy">Chính sách</TabsTrigger>
          <TabsTrigger value="shipping">Vận chuyển</TabsTrigger>
          <TabsTrigger value="payment">Thanh toán</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-5">
              <CardTitle className="flex items-center gap-2 text-lg"><Store className="h-5 w-5 text-orange-600" /> Thông tin shop</CardTitle>
              <p className="text-sm text-muted-foreground">Thông tin hiển thị công khai trên trang cửa hàng.</p>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <section className="shop-brand-assets rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="mb-4 flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><ImageIcon className="h-5 w-5" /></span><div><h2 className="font-semibold text-slate-900">Nhận diện cửa hàng</h2><p className="mt-0.5 text-sm text-muted-foreground">Quản lý logo và ảnh bìa của shop.</p></div></div>
                <div className="relative pt-16 sm:pt-20">
                  <div className="relative z-0"><BrandAssetControl label="Ảnh bìa shop" helper="Tỷ lệ đề xuất 16:5 · JPG, PNG, WEBP · tối đa 5MB" imageUrl={shopData.shopLogo} uploadType="cover" onUploaded={(url) => setShopData(prev => ({ ...prev, shopLogo: url }))} cover /></div>
                  <div className="relative z-10 mx-3 -mt-10 w-auto sm:absolute sm:bottom-4 sm:left-5 sm:mx-0 sm:mt-0 sm:w-[285px]"><BrandAssetControl label="Logo cửa hàng" helper="JPG, PNG, WEBP · tối đa 5MB" imageUrl={shopData.vendorLogo} uploadType="logo" onUploaded={(url) => setShopData(prev => ({ ...prev, vendorLogo: url }))} /></div>
                </div>
              </section>

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

              <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="grid gap-4 sm:grid-cols-2">
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

              <div>
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

        <TabsContent value="payment" className="mt-0">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-5">
              <CardTitle>Cài đặt thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="cod" 
                  disabled 
                  defaultChecked
                />
                <Label htmlFor="cod">Thanh toán khi nhận hàng (COD)</Label>
              </div>
              <Tabs defaultValue="bank" className="w-full">
                <TabsList className="h-auto rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <TabsTrigger value="bank" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Tài khoản ngân hàng</TabsTrigger>
                  <TabsTrigger value="wallet" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Ví điện tử</TabsTrigger>
                </TabsList>
                <TabsContent value="bank" className="mt-5 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label>Số tài khoản</Label><Input value={shopData.bankAccount} onChange={(e) => setShopData(prev => ({ ...prev, bankAccount: e.target.value }))} className="mt-2" placeholder="Nhập số tài khoản" /></div>
                    <div>
                      <Label>Tên ngân hàng</Label>
                      <BankPicker
                        banks={banks}
                        selectedBin={shopData.bankBin}
                        selectedName={shopData.bankName}
                        loading={!banks.length && !banksError}
                        onSelect={(bank) => setShopData((prev) => ({
                          ...prev,
                          bankBin: bank.bin,
                          bankCode: bank.code,
                          bankName: bank.name,
                        }))}
                      />
                      {banksError && <p className="mt-1.5 text-xs text-destructive">{banksError} <button type="button" className="underline" onClick={fetchBanks}>Tải lại</button></p>}
                    </div>
                  </div>
                  <div><Label>Chi nhánh <span className="font-normal text-muted-foreground">(không bắt buộc)</span></Label><Input value={shopData.bankBranch} onChange={(e) => setShopData(prev => ({ ...prev, bankBranch: e.target.value }))} className="mt-2" placeholder="Nhập chi nhánh" /></div>
                </TabsContent>
                <TabsContent value="wallet" className="mt-5 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm text-muted-foreground">Cần tên ví và số nhận tiền để mở phương thức thanh toán ví tại checkout.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Nhà cung cấp ví <span className="font-normal text-muted-foreground">(không bắt buộc)</span></Label>
                      <Select
                        value={shopData.walletProvider || "__none"}
                        onValueChange={(value) => setShopData((prev) => ({ ...prev, walletProvider: value === "__none" ? "" : value }))}
                      >
                        <SelectTrigger className="mt-2 h-auto min-h-10 w-full py-2 text-left">
                          <SelectValue placeholder="Chọn ví điện tử" />
                        </SelectTrigger>
                        <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
                          <SelectItem value="__none" className="py-2.5 text-muted-foreground">Chưa cấu hình ví điện tử</SelectItem>
                          {WALLET_PROVIDERS.map((wallet) => (
                            <SelectItem key={wallet} value={wallet} className="py-2.5 font-medium text-slate-900">
                              {wallet}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Số điện thoại / tài khoản ví <span className="font-normal text-muted-foreground">(không bắt buộc)</span></Label><Input value={shopData.walletAccount} onChange={(e) => setShopData(prev => ({ ...prev, walletAccount: e.target.value }))} className="mt-2" placeholder="Nhập số nhận tiền" /></div>
                  </div>
                  <div><Label>Đường dẫn ảnh QR ví <span className="font-normal text-muted-foreground">(không bắt buộc)</span></Label><Input type="url" value={shopData.walletQrUrl} onChange={(e) => setShopData(prev => ({ ...prev, walletQrUrl: e.target.value }))} className="mt-2" placeholder="https://..." /><p className="mt-1.5 text-xs text-muted-foreground">Nếu để trống, khách vẫn nhận được thông tin ví để thanh toán thủ công.</p></div>
                </TabsContent>
              </Tabs>

              <Button 
                onClick={handleSaveGeneral}
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
