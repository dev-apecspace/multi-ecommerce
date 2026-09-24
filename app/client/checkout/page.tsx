"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, ExternalLink, MapPin, Tag, X, CreditCard, Wallet, Download, Copy, Upload } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useLoading } from "@/hooks/use-loading"
import { CheckoutAddressDialog } from "@/components/client/checkout-address-dialog"
import { computePrice } from "@/lib/price-utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BankAppPicker } from '@/components/client/bank-app-picker'
import { PaymentProofProgress } from '@/components/client/payment-proof-progress'

interface CheckoutItem {
  id: number
  productId: number
  productName: string
  quantity: number
  price: number // Sale price if campaign applied, otherwise base price
  basePrice?: number
  originalPrice?: number
  salePrice?: number | null
  taxApplied?: boolean
  taxRate?: number
  image: string
  variantId: number | null
  variantName?: string
  vendorId: number
  vendorName: string
}

interface Address {
  id: number
  label: string
  fullName: string
  phone: string
  street: string
  ward: string
  district: string
  city: string
  postalCode?: string
  isDefault: boolean
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()
  const { refetchCart } = useCart()
  const { setIsLoading } = useLoading()
  const [step, setStep] = useState<"shipping" | "payment" | "review" | "success">("shipping")
  const [cartItems, setCartItems] = useState<CheckoutItem[]>([])
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    street: "",
    ward: "",
    district: "",
    city: "",
    shippingMethod: "",
    paymentMethod: "",
  })
  const [isEditingManually, setIsEditingManually] = useState(false)
  const [vendorBankingInfo, setVendorBankingInfo] = useState<Record<number, {
    vendorName: string
    bankAccount: string | null
    bankName: string | null
    bankBin?: string | null
    bankBranch: string | null
    walletProvider?: string | null
    walletAccount?: string | null
    walletQrUrl?: string | null
  }>>({})
  const [vendorVouchers, setVendorVouchers] = useState<Record<number, {
    voucherId: number
    code: string
    discountAmount: number
    discountType: 'percentage' | 'fixed'
    discountValue: number
  }>>({})
  const [voucherInputs, setVoucherInputs] = useState<Record<number, string>>({})
  const [voucherLoading, setVoucherLoading] = useState<Record<number, boolean>>({})
  const [publicVouchers, setPublicVouchers] = useState<Record<number, any[]>>({})
  const [showVoucherList, setShowVoucherList] = useState<Record<number, boolean>>({})
  const [walletAgreementConfirmed, setWalletAgreementConfirmed] = useState(false)
  const [siteTermsConfirmed, setSiteTermsConfirmed] = useState(false)
  const [consentDialog, setConsentDialog] = useState<"wallet" | "terms" | null>(null)
  const [savingConsent, setSavingConsent] = useState<"wallet" | "terms" | null>(null)
  const [createdOrders, setCreatedOrders] = useState<CreatedOrderPayment[]>([])
  const [proofSubmitting, setProofSubmitting] = useState<Record<number, boolean>>({})
  const [proofConfirmation, setProofConfirmation] = useState<{ order: CreatedOrderPayment; file: File | null; previewUrl: string | null } | null>(null)
  const [proofOcr, setProofOcr] = useState<{ checking: boolean; status?: string; reason?: string }>({ checking: false })
  const paymentProofOcrEnabled = process.env.NEXT_PUBLIC_PAYMENT_PROOF_OCR_ENABLED !== 'false'
  const [systemSettings, setSystemSettings] = useState({ codEnabled: true, accountEnabled: true, walletEnabled: false, standardShippingFee: 10000, expressShippingFee: 30000, paymentMethods: [{ id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', enabled: true }, { id: 'bank', label: 'Tài khoản', enabled: true }, { id: 'wallet', label: 'Ví điện tử', enabled: false }], shippingMethods: [{ id: 'standard', label: 'Giao tiêu chuẩn 1-3 ngày', enabled: true, fee: 10000 }, { id: 'express', label: 'Giao nhanh 2-3 giờ', enabled: true, fee: 30000 }] })

  useEffect(() => {
    fetch('/api/settings').then(async response => {
      if (!response.ok) return
      const result = await response.json()
      if (result.settings) {
        // Temporarily hide wallet payments and exclude them from checkout validation.
        setSystemSettings({
          ...result.settings,
          walletEnabled: false,
          paymentMethods: result.settings.paymentMethods.map((method: { id: string; label: string; enabled: boolean }) =>
            method.id === 'wallet' ? { ...method, enabled: false } : method
          ),
        })
      }
    }).catch(() => undefined)
  }, [])

  const copyPaymentValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast({ title: `Đã sao chép ${label}` })
    } catch {
      toast({ title: 'Không thể sao chép', description: 'Vui lòng sao chép thủ công.', variant: 'destructive' })
    }
  }
  const checkoutSteps = ["shipping", "payment", "review"] as const

  const goToStep = (nextStep: "shipping" | "payment" | "review" | "success") => {
    setStep(nextStep)
    if (nextStep !== "success") router.replace(`/client/checkout?step=${nextStep}`, { scroll: false })
  }

  useEffect(() => {
    const requestedStep = searchParams.get("step")
    if (requestedStep && checkoutSteps.includes(requestedStep as (typeof checkoutSteps)[number])) {
      setStep(requestedStep as "shipping" | "payment" | "review")
    }
  }, [searchParams])

  const checkWalletAgreement = async () => {
    try {
      const response = await fetch('/api/policy-acceptances?policyCode=intermediary-payment-agreement', { credentials: 'include' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setWalletAgreementConfirmed(result.accepted === true)
      if (result.accepted !== true) setConsentDialog('wallet')
    } catch (error) {
      setWalletAgreementConfirmed(false)
      setConsentDialog('wallet')
      toast({ title: 'Không thể kiểm tra xác nhận', description: error instanceof Error ? error.message : 'Vui lòng xác nhận hợp đồng trước khi tiếp tục.', variant: 'destructive' })
    }
  }

  const checkSiteTermsAcceptance = async () => {
    try {
      const response = await fetch('/api/policy-acceptances?policyCode=website-operating-conditions', { credentials: 'include' })
      const result = await response.json()
      if (response.ok) setSiteTermsConfirmed(result.accepted === true)
    } catch {
      setSiteTermsConfirmed(false)
    }
  }

  const savePolicyAcceptance = async (type: "wallet" | "terms") => {
    const policyCodes = type === "wallet" ? ["intermediary-payment-agreement"] : ["website-operating-conditions"]
    try {
      setSavingConsent(type)
      await Promise.all(policyCodes.map(async (policyCode) => {
        const response = await fetch("/api/policy-acceptances", {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policyCode }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Không thể lưu xác nhận chính sách.")
      }))
      if (type === "wallet") setWalletAgreementConfirmed(true)
      else setSiteTermsConfirmed(true)
      setConsentDialog(null)
      return true
    } catch (error) {
      toast({ title: "Chưa thể xác nhận", description: error instanceof Error ? error.message : "Vui lòng thử lại trước khi tiếp tục thanh toán.", variant: "destructive" })
      return false
    } finally {
      setSavingConsent(null)
    }
  }

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id)
      
      fetch(`/api/addresses?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          const addrList = Array.isArray(data) ? data : []
          setAddresses(addrList)
          
          const defaultAddr = addrList.find((a: Address) => a.isDefault)
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id)
            setFormData(prev => ({
              ...prev,
              fullName: defaultAddr.fullName,
              phone: defaultAddr.phone,
              street: defaultAddr.street,
              ward: defaultAddr.ward,
              district: defaultAddr.district,
              city: defaultAddr.city,
            }))
          }
        })
        .catch(error => console.error('Failed to fetch addresses:', error))
    } else {
      const storedUserId = localStorage.getItem('userId')
      if (storedUserId) {
        const numUserId = parseInt(storedUserId)
        setUserId(numUserId)
        
        fetch(`/api/addresses?userId=${numUserId}`)
          .then(res => res.json())
          .then(data => {
            const addrList = Array.isArray(data) ? data : []
            setAddresses(addrList)
            
            const defaultAddr = addrList.find((a: Address) => a.isDefault)
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id)
              setFormData(prev => ({
                ...prev,
                fullName: defaultAddr.fullName,
                phone: defaultAddr.phone,
                street: defaultAddr.street,
                ward: defaultAddr.ward,
                district: defaultAddr.district,
                city: defaultAddr.city,
              }))
            }
          })
          .catch(error => console.error('Failed to fetch addresses:', error))
      }
    }
    
    const checkoutItemsJson = sessionStorage.getItem('checkoutItems')
    if (checkoutItemsJson) {
      try {
        const items = JSON.parse(checkoutItemsJson)
        setCartItems(items)
      } catch (error) {
        toast({ title: 'Lỗi', description: 'Không thể tải thông tin thanh toán', variant: 'destructive' })
        router.push('/client/cart')
      }
    } else {
      router.push('/client/cart')
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        phone: prev.phone || user.phone || ""
      }))
    }
  }, [user])

  // Fetch banking info for all vendors when cartItems change
  useEffect(() => {
    const fetchBankingInfo = async () => {
      const uniqueVendorIds = [...new Set(cartItems.map(item => item.vendorId))]
      const bankingInfo: Record<number, {
        vendorName: string
        bankAccount: string | null
        bankName: string | null
        bankBin?: string | null
        bankBranch: string | null
        walletProvider?: string | null
        walletAccount?: string | null
        walletQrUrl?: string | null
      }> = {}

      await Promise.all(
        uniqueVendorIds.map(async (vendorId) => {
          try {
            const response = await fetch(`/api/vendors/${vendorId}/banking`)
            if (response.ok) {
              const data = await response.json()
              bankingInfo[vendorId] = {
                vendorName: data.vendorName,
                bankAccount: data.bankAccount,
                bankName: data.bankName,
                bankBin: data.bankBin,
                bankBranch: data.bankBranch,
                walletProvider: data.walletProvider,
                walletAccount: data.walletAccount,
                walletQrUrl: data.walletQrUrl,
              }
            }
          } catch (error) {
            console.error(`Failed to fetch banking info for vendor ${vendorId}:`, error)
          }
        })
      )

      setVendorBankingInfo(bankingInfo)
    }

    if (cartItems.length > 0) {
      fetchBankingInfo()
    }
  }, [cartItems])

  const handleSelectAddress = (address: Address) => {
    setSelectedAddressId(address.id)
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      ward: address.ward,
      district: address.district,
      city: address.city,
      shippingMethod: formData.shippingMethod,
      paymentMethod: formData.paymentMethod,
    })
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
  }

  const getVendorSubtotal = (vendorId: number) => {
    return cartItems
      .filter(item => item.vendorId === vendorId)
      .reduce((sum, item) => {
        const priced = computePrice({
          basePrice: item.basePrice ?? item.price,
          originalPrice: item.originalPrice,
          salePrice: item.salePrice,
          taxApplied: item.taxApplied,
          taxRate: item.taxRate,
        })
        return sum + (priced.displayPrice * item.quantity)
      }, 0)
  }

  const subtotal = cartItems.reduce((sum, item) => {
    const priced = computePrice({
      basePrice: item.basePrice ?? item.price,
      originalPrice: item.originalPrice,
      salePrice: item.salePrice,
      taxApplied: item.taxApplied,
      taxRate: item.taxRate,
    })
    return sum + (priced.displayPrice * item.quantity)
  }, 0)
  const shippingCostPerVendor = Number(systemSettings.shippingMethods.find(method => method.id === formData.shippingMethod)?.fee || 0)
  const uniqueVendors = new Set(cartItems.map(item => item.vendorId)).size
  const totalShippingCost = shippingCostPerVendor * uniqueVendors
  
  const totalVoucherDiscount = Object.values(vendorVouchers).reduce((sum, v) => sum + v.discountAmount, 0)
  const total = subtotal + totalShippingCost - totalVoucherDiscount
  const vendorGroups = Object.entries(cartItems.reduce((acc, item) => {
    if (!acc[item.vendorId]) acc[item.vendorId] = { vendorName: item.vendorName, items: [] as CheckoutItem[] }
    acc[item.vendorId].items.push(item)
    return acc
  }, {} as Record<number, { vendorName: string; items: CheckoutItem[] }>))

  const submitPostOrderProof = async (order: CreatedOrderPayment, file?: File) => {
    if (!file || !userId) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({ title: 'Ảnh chưa hợp lệ', description: 'Chỉ nhận JPG, PNG, WEBP tối đa 5MB.', variant: 'destructive' })
      return
    }
    try {
      setProofSubmitting(current => ({ ...current, [order.id]: true }))
      const body = new FormData(); body.append('file', file); body.append('userId', String(userId))
      const response = await fetch(`/api/client/orders/by-number/${encodeURIComponent(order.orderNumber)}/payment-proof`, { method: 'POST', body, credentials: 'include' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không thể gửi minh chứng.')
      setCreatedOrders(current => current.map(created => created.id === order.id ? { ...created, paymentStatus: 'submitted', paymentProofUrl: result.data?.paymentProofUrl || created.paymentProofUrl } : created))
      toast({ title: 'Đã gửi minh chứng', description: result.data?.verification?.status === 'review' ? 'Shop sẽ đối soát thủ công ảnh giao dịch.' : 'Shop sẽ đối soát thanh toán của bạn.' })
    } catch (error) {
      toast({ title: 'Chưa thể gửi minh chứng', description: error instanceof Error ? error.message : 'Vui lòng thử lại.', variant: 'destructive' })
    } finally {
      setProofSubmitting(current => ({ ...current, [order.id]: false }))
    }
  }

  const openProofConfirmation = (order: CreatedOrderPayment) => {
    setProofConfirmation({ order, file: null, previewUrl: null })
    setProofOcr({ checking: false })
  }

  const selectPostOrderProof = async (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({ title: 'Ảnh chưa hợp lệ', description: 'Chỉ nhận JPG, PNG, WEBP tối đa 5MB.', variant: 'destructive' })
      return
    }
    const selectedOrder = proofConfirmation?.order
    if (!selectedOrder) return
    setProofConfirmation(current => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl)
      return current ? { ...current, file, previewUrl: URL.createObjectURL(file) } : current
    })
    if (!paymentProofOcrEnabled) {
      setProofOcr({ checking: false })
      return
    }
    setProofOcr({ checking: true })
    try {
      const body = new FormData()
      body.append('file', file); body.append('orderNumber', selectedOrder.orderNumber); body.append('amount', String(selectedOrder.total)); body.append('orderCreatedAt', selectedOrder.date || new Date().toISOString())
      const response = await fetch('/api/client/payment-proof/preflight', { method: 'POST', body })
      const result = await response.json().catch(() => null)
      const verification = result?.data?.verification || result?.verification
      setProofOcr({ checking: false, status: verification?.status || 'error', reason: verification?.reason || result?.error || 'Không thể kiểm tra ảnh.' })
    } catch {
      setProofOcr({ checking: false, status: 'error', reason: 'Không thể kết nối dịch vụ kiểm tra ảnh. Vui lòng thử lại.' })
    }
  }

  const closeProofConfirmation = () => {
    setProofConfirmation(current => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl)
      return null
    })
  }

  const confirmPostOrderProof = async () => {
    if (!proofConfirmation) return
    const { order, file } = proofConfirmation
    if (!file) return
    closeProofConfirmation()
    await submitPostOrderProof(order, file)
  }
  const handleApplyVoucher = async (vendorId: number) => {
    const code = voucherInputs[vendorId]?.trim()
    if (!code) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập mã voucher', variant: 'destructive' })
      return
    }

    try {
      setVoucherLoading(prev => ({ ...prev, [vendorId]: true }))
      const vendorSubtotal = getVendorSubtotal(vendorId)

      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          vendorId,
          orderValue: vendorSubtotal,
          userId: userId || user?.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Mã voucher không hợp lệ')
      }

      const data = await response.json()
      setVendorVouchers(prev => ({
        ...prev,
        [vendorId]: {
          voucherId: data.voucherId,
          code: data.code,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          discountValue: data.discountValue,
        },
      }))
      toast({ title: 'Thành công', description: `Áp dụng voucher: -${data.discountAmount.toLocaleString('vi-VN')}₫` })
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể áp dụng voucher',
        variant: 'destructive',
      })
    } finally {
      setVoucherLoading(prev => ({ ...prev, [vendorId]: false }))
    }
  }

  const handleRemoveVoucher = (vendorId: number) => {
    setVendorVouchers(prev => {
      const newVouchers = { ...prev }
      delete newVouchers[vendorId]
      return newVouchers
    })
    setVoucherInputs(prev => ({ ...prev, [vendorId]: '' }))
  }

  const fetchPublicVouchers = async (vendorId: number) => {
    try {
      const response = await fetch(`/api/vouchers/public?vendorId=${vendorId}`)
      if (!response.ok) throw new Error('Failed to fetch vouchers')
      const { data } = await response.json()
      setPublicVouchers(prev => ({ ...prev, [vendorId]: data || [] }))
    } catch (error) {
      console.error('Failed to fetch public vouchers:', error)
    }
  }

  const handleSelectVoucher = async (vendorId: number, voucher: any) => {
    try {
      setVoucherLoading(prev => ({ ...prev, [vendorId]: true }))
      const vendorSubtotal = getVendorSubtotal(vendorId)

      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucher.code,
          vendorId,
          orderValue: vendorSubtotal,
          userId: userId || user?.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Mã voucher không hợp lệ')
      }

      const data = await response.json()
      setVendorVouchers(prev => ({
        ...prev,
        [vendorId]: {
          voucherId: data.voucherId,
          code: data.code,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          discountValue: data.discountValue,
        },
      }))
      setShowVoucherList(prev => ({ ...prev, [vendorId]: false }))
      setVoucherInputs(prev => ({ ...prev, [vendorId]: '' }))
      toast({ title: 'Thành công', description: `Áp dụng voucher: -${data.discountAmount.toLocaleString('vi-VN')}₫` })
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể áp dụng voucher',
        variant: 'destructive',
      })
    } finally {
      setVoucherLoading(prev => ({ ...prev, [vendorId]: false }))
    }
  }

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      toast({ title: "Giỏ hàng trống", description: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.", variant: "destructive" })
      return
    }

    if (step === "payment" && formData.paymentMethod === "wallet" && !walletAgreementConfirmed) {
      setConsentDialog("wallet")
      return
    }

    if (step === "review") {
      if (!formData.fullName.trim()) {
        toast({ title: "Chưa nhập người nhận", description: "Vui lòng chọn hoặc nhập họ tên người nhận.", variant: "destructive" })
        goToStep("shipping")
        return
      }
      if (!formData.phone.trim()) {
        toast({ title: "Chưa nhập số điện thoại", description: "Vui lòng nhập số điện thoại người nhận.", variant: "destructive" })
        goToStep("shipping")
        return
      }
      if (!formData.street.trim() || !formData.ward.trim() || !formData.district.trim() || !formData.city.trim()) {
        toast({ title: "Chưa nhập đủ địa chỉ", description: "Vui lòng chọn hoặc nhập đầy đủ địa chỉ giao hàng.", variant: "destructive" })
        goToStep("shipping")
        return
      }
      if (!systemSettings.shippingMethods.some(method => method.id === formData.shippingMethod && method.enabled)) {
        toast({ title: "Chưa chọn hình thức giao hàng", description: "Vui lòng chọn giao nhanh hoặc giao tiêu chuẩn.", variant: "destructive" })
        goToStep("shipping")
        return
      }
      if (!systemSettings.paymentMethods.some(method => method.id === formData.paymentMethod && method.enabled)) {
        toast({ title: "Chưa chọn phương thức thanh toán", description: "Vui lòng chọn phương thức thanh toán đang khả dụng.", variant: "destructive" })
        goToStep("payment")
        return
      }
      if (formData.paymentMethod === "wallet" && !walletAgreementConfirmed) {
        setConsentDialog("wallet")
        return
      }
      if (!siteTermsConfirmed) {
        const saved = await savePolicyAcceptance("terms")
        if (!saved) return
      }
    }

    if (step === "shipping") {
      if (!formData.fullName.trim()) { toast({ title: "Chưa nhập người nhận", description: "Vui lòng chọn hoặc nhập họ tên người nhận.", variant: "destructive" }); return }
      if (!formData.phone.trim()) { toast({ title: "Chưa nhập số điện thoại", description: "Vui lòng nhập số điện thoại người nhận.", variant: "destructive" }); return }
      if (!formData.street.trim()) { toast({ title: "Chưa nhập địa chỉ", description: "Vui lòng nhập số nhà, tên đường giao hàng.", variant: "destructive" }); return }
      if (!formData.ward.trim()) { toast({ title: "Chưa chọn phường/xã", description: "Vui lòng chọn hoặc nhập phường/xã.", variant: "destructive" }); return }
      if (!formData.district.trim()) { toast({ title: "Chưa chọn quận/huyện", description: "Vui lòng chọn hoặc nhập quận/huyện.", variant: "destructive" }); return }
      if (!formData.city.trim()) { toast({ title: "Chưa chọn tỉnh/thành phố", description: "Vui lòng chọn hoặc nhập tỉnh/thành phố.", variant: "destructive" }); return }
      if (!systemSettings.shippingMethods.some(method => method.id === formData.shippingMethod && method.enabled)) { toast({ title: "Chưa chọn hình thức giao hàng", description: "Vui lòng chọn hình thức giao hàng.", variant: "destructive" }); return }
      goToStep("payment")
    } else if (step === "payment") {
      if (!systemSettings.paymentMethods.some(method => method.id === formData.paymentMethod && method.enabled)) {
        toast({ title: "Chưa chọn phương thức thanh toán", description: "Vui lòng chọn phương thức thanh toán đang khả dụng.", variant: "destructive" })
        return
      }
      setSiteTermsConfirmed(false)
      void checkSiteTermsAcceptance()
      goToStep("review")
    } else if (step === "review") {
      if (!userId) {
        toast({ title: 'Lỗi', description: 'Vui lòng đăng nhập', variant: 'destructive' })
        return
      }

      setLoading(true)
      setIsLoading(true)
      try {
        const response = await fetch('/api/client/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            cartItems: cartItems.map(item => ({
              productId: item.productId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              price: item.price,
              basePrice: item.basePrice,
              salePrice: item.salePrice,
              originalPrice: item.originalPrice,
              taxApplied: item.taxApplied,
              taxRate: item.taxRate,
              vendorId: item.vendorId,
              voucherId: vendorVouchers[item.vendorId]?.voucherId || null
            })),
            shippingAddress: {
              fullName: formData.fullName,
              phone: formData.phone,
              street: formData.street,
              ward: formData.ward,
              district: formData.district,
              city: formData.city
            },
            paymentMethod: formData.paymentMethod,
            shippingMethod: formData.shippingMethod,
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            vendorVouchers: Object.fromEntries(
              Object.entries(vendorVouchers).map(([vendorId, voucher]) => [
                vendorId,
                { voucherId: voucher.voucherId, discountAmount: voucher.discountAmount }
              ])
            )
          })
        })

        if (!response.ok) {
          const result = await response.json().catch(() => null)
          throw new Error(result?.error || 'Không thể tạo đơn hàng.')
        }

        const result = await response.json()
        setCreatedOrders(Array.isArray(result.data) ? result.data : [])
        sessionStorage.removeItem('checkoutItems')
        await refetchCart()
        toast({ title: 'Thành công', description: 'Đơn hàng của bạn đã được đặt' })
        goToStep("success")
      } catch (error) {
        toast({ title: 'Không thể đặt hàng', description: error instanceof Error ? error.message : 'Vui lòng thử lại sau.', variant: 'destructive' })
      } finally {
        setLoading(false)
        setIsLoading(false)
      }
    }
  }

  if (step === "success") {
    return (
      <main className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950 sm:py-12">
        <div className="container-viewport">
          <div className="mx-auto max-w-[720px]">
            <header className="mb-6 flex items-start gap-3 px-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                <Check className="h-5 w-5 text-green-600" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Đặt hàng thành công</h1>
                <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">Đơn hàng đã được tạo. Bạn có thể theo dõi và thanh toán từng đơn bên dưới.</p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{createdOrders.length} {createdOrders.length === 1 ? 'đơn hàng' : 'đơn hàng'} vừa được tạo</p>
              </div>
            </header>

            <div className="space-y-4">
              {createdOrders.map((order) => {
                  const needsPayment = ['bank', 'wallet'].includes(order.paymentMethod) && order.paymentStatus !== 'paid'
                  const qrUrl = order.paymentMethod === 'wallet' ? order.Vendor?.walletQrUrl || null : getBankQr(order)
                  const isManualWallet = order.paymentMethod === 'wallet' && !qrUrl
                  const recipient = order.paymentMethod === 'wallet' ? `${order.Vendor?.walletProvider || 'Ví điện tử'} · ${order.Vendor?.walletAccount || 'Chưa có thông tin ví'}` : `${order.Vendor?.bankName || 'Ngân hàng'} · ${order.Vendor?.bankAccount || 'Chưa có số tài khoản'}`
                  const statusLabel = order.paymentStatus === 'paid' ? 'Đã thanh toán' : order.paymentStatus === 'submitted' ? 'Đã gửi minh chứng' : needsPayment ? 'Chờ thanh toán' : 'Thanh toán khi nhận hàng'
                  const statusClassName = order.paymentStatus === 'paid' ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300' : order.paymentStatus === 'submitted' ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300' : needsPayment ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300' : 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  return <article key={order.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
                      <div className="min-w-0"><p className="text-xs font-medium text-slate-500 dark:text-slate-400">Mã đơn hàng</p><h2 className="mt-0.5 truncate text-base font-semibold text-slate-950 dark:text-slate-50">{order.orderNumber}</h2><p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{order.Vendor?.name || 'Shop'}</p></div>
                      <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${statusClassName}`}>{statusLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"><span className="text-sm text-slate-600 dark:text-slate-300">Tổng thanh toán</span><strong className="text-base text-slate-950 dark:text-slate-50">{Number(order.total).toLocaleString('vi-VN')}₫</strong></div>
                    {needsPayment && <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40 sm:px-5">
                      <div className="mb-4 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center text-[11px] font-medium sm:text-xs"><span className="text-blue-700 dark:text-blue-300">Thanh toán</span><span className="h-px bg-slate-300 dark:bg-slate-700" /><span className={order.paymentStatus === 'submitted' ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}>Gửi minh chứng</span><span className="h-px bg-slate-300 dark:bg-slate-700" /><span className="text-slate-500 dark:text-slate-400">Shop đối soát</span></div>
                      <div className="mb-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Thanh toán cho shop</p>{!isManualWallet && <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">{recipient}</p>}</div>{order.paymentMethod === 'wallet' ? <Wallet className="h-5 w-5 shrink-0 text-blue-600" /> : <CreditCard className="h-5 w-5 shrink-0 text-blue-600" />}</div>
                    {qrUrl ? <img src={qrUrl} alt={`Mã QR thanh toán ${order.orderNumber}`} className="mx-auto my-4 h-48 w-48 max-w-full rounded-md border border-slate-200 bg-white object-contain p-2" /> : order.paymentMethod === 'wallet' ? <div className="my-4 overflow-hidden rounded-md border border-blue-200 bg-white text-sm shadow-sm dark:border-blue-900 dark:bg-slate-900">
                      <div className="border-b border-blue-100 bg-blue-100/70 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-800">Thanh toán thủ công qua ví</div>
                      {[
                        ['Ví điện tử', order.Vendor?.walletProvider || 'Chưa có thông tin ví', order.Vendor?.walletProvider || ''],
                        ['Số tài khoản / SĐT', order.Vendor?.walletAccount || 'Chưa có số nhận tiền', order.Vendor?.walletAccount || ''],
                        ['Số tiền', `${Number(order.total).toLocaleString('vi-VN')}₫`, String(Math.round(Number(order.total)))],
                        ['Nội dung', order.orderNumber, order.orderNumber],
                      ].map(([label, displayValue, copyValue], index) => <div key={label} className={`flex min-w-0 items-center gap-3 border-b border-blue-50 px-3 py-2.5 last:border-0 ${index === 2 ? 'bg-blue-50/80' : ''}`}><span className="w-28 shrink-0 text-xs font-medium text-slate-500">{label}</span><span className={`min-w-0 flex-1 break-all text-slate-900 ${index === 2 ? 'text-base font-bold text-blue-800' : 'font-semibold'}`}>{displayValue}</span><Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 border border-blue-100 bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800" onClick={() => copyPaymentValue(copyValue, label)} disabled={!copyValue} aria-label={`Sao chép ${label}`}><Copy className="h-4 w-4" /></Button></div>)}
                    </div> : <p className="my-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">Shop chưa cấu hình thông tin nhận tiền. Vui lòng liên hệ shop để được hỗ trợ.</p>}
                    {!(order.paymentMethod === 'wallet' && !qrUrl) && <div className="space-y-1 text-sm"><p>Số tiền: <b>{Number(order.total).toLocaleString('vi-VN')}₫</b></p><p>Nội dung: <b className="font-mono">{order.orderNumber}</b></p></div>}
                    <p className="mt-4 rounded-md bg-white/80 p-3 text-xs leading-5 text-slate-600">Lưu ý: Hãy chụp màn hình giao dịch sau khi thanh toán để gửi minh chứng đối soát.</p>
                    <PaymentProofProgress status={order.paymentStatus} />
                    {order.paymentMethod === 'bank' ? <BankAppPicker orderId={order.id} orderNumber={order.orderNumber} amount={order.total} recipientAccount={order.Vendor?.bankAccount} recipientBankCode={order.Vendor?.bankCode} /> : null}
                    {order.paymentStatus === 'submitted' ? <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-center text-sm font-medium text-amber-800">Đã gửi minh chứng — chờ shop xác nhận.</div> : <Button type="button" variant="outline" className="mt-3 w-full border-dashed border-blue-300 bg-white text-blue-700 hover:bg-blue-50" disabled={proofSubmitting[order.id]} onClick={() => openProofConfirmation(order)}><Upload className="mr-2 h-4 w-4" />{proofSubmitting[order.id] ? 'Đang gửi minh chứng...' : 'Tải ảnh minh chứng thanh toán'}</Button>}
                    </div>}
                    <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5"><Link href={`/client/orders/${encodeURIComponent(order.orderNumber)}`} className="block"><Button variant="outline" className="w-full border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">Xem chi tiết đơn</Button></Link></div>
                  </article>
                })}
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/client/order-history" className="flex-1"><Button className="h-11 w-full bg-blue-700 hover:bg-blue-800">Xem đơn hàng</Button></Link>
              <Link href="/" className="flex-1"><Button variant="outline" className="h-11 w-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">Tiếp tục mua sắm</Button></Link>
            </div>
            <Dialog open={!!proofConfirmation} onOpenChange={(open) => !open && closeProofConfirmation()}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Xác nhận gửi minh chứng</DialogTitle><DialogDescription>Hãy kiểm tra ảnh thuộc đúng đơn và hiển thị rõ số tiền, nội dung chuyển khoản cùng thời gian giao dịch.</DialogDescription></DialogHeader>
                {proofConfirmation && <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900"><p>Đơn hàng: <b className="font-mono">{proofConfirmation.order.orderNumber}</b></p><p className="mt-1">Số tiền: <b>{Number(proofConfirmation.order.total).toLocaleString('vi-VN')}₫</b></p></div>
                  <Label htmlFor="post-order-proof-file-success" className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-blue-300 bg-white px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50"><Upload className="h-4 w-4" />{proofConfirmation.file ? 'Chọn ảnh khác' : 'Chọn ảnh minh chứng'}</Label>
                  <Input id="post-order-proof-file-success" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void selectPostOrderProof(event.target.files?.[0]); event.currentTarget.value = '' }} />
                  {proofConfirmation.previewUrl ? <img src={proofConfirmation.previewUrl} alt="Xem trước minh chứng thanh toán" className="max-h-72 w-full rounded-lg border bg-white object-contain" /> : <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">Chưa chọn ảnh minh chứng.</p>}
                  {paymentProofOcrEnabled && (proofOcr.checking ? <p className="text-sm font-medium text-blue-700">Đang kiểm tra ảnh…</p> : proofOcr.status ? <p className={`rounded-md p-3 text-sm ${proofOcr.status === 'verified' ? 'bg-emerald-50 text-emerald-800' : proofOcr.status === 'review' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'}`}>{proofOcr.reason}</p> : null)}
                </div>}
                <DialogFooter><Button variant="outline" onClick={closeProofConfirmation}>Hủy</Button><Button disabled={!proofConfirmation?.file || (paymentProofOcrEnabled && (proofOcr.checking || ['rejected', 'error', 'unavailable'].includes(proofOcr.status || '')))} onClick={() => void confirmPostOrderProof()}>Xác nhận gửi minh chứng</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    )
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-surface dark:bg-slate-950">
        <div className="container-viewport py-12 text-center">
          <p>Đang tải...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <div className="container-viewport py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Thanh toán</h1>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              if (step === "review") goToStep("payment")
              else if (step === "payment") goToStep("shipping")
              else router.back()
            }}
          >
            {step === "shipping" ? "Quay lại giỏ hàng" : "Quay lại"}
          </Button>
        </div>

        <div className="space-y-6">
            <nav aria-label="Các bước thanh toán" className="mb-8 flex gap-2 overflow-x-auto pb-1 sm:gap-4">
              {checkoutSteps.map((s, idx) => {
                const isCurrent = step === s
                const isCompleted = checkoutSteps.indexOf(step as (typeof checkoutSteps)[number]) > idx
                const isAccessible = idx < checkoutSteps.indexOf(step as (typeof checkoutSteps)[number])
                return <button
                  key={s}
                  type="button"
                  disabled={!isAccessible}
                  onClick={() => isAccessible && goToStep(s)}
                  className={`min-w-40 flex-1 rounded-lg border p-3 text-left transition-all disabled:cursor-default ${
                    isCurrent
                      ? "bg-primary/10 border-primary"
                      : isCompleted
                        ? "bg-green-50 dark:bg-green-950 border-green-300"
                        : "border-border"
                  } ${isAccessible ? "cursor-pointer hover:border-primary" : ""}`}
                >
                  <div className="text-sm font-medium">
                    {idx + 1}. {s === "shipping" ? "Giao hàng" : s === "payment" ? "Thanh toán" : "Kiểm tra"}
                  </div>
                </button>
              })}
            </nav>

            <Card>
              <CardHeader>
                <CardTitle>
                  {step === "shipping" && "Địa chỉ giao hàng"}
                  {step === "payment" && "Phương thức thanh toán"}
                  {step === "review" && "Kiểm tra đơn hàng"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {step === "shipping" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-950 dark:to-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            {formData.fullName ? (
                              <>
                                <p className="font-semibold text-sm">{formData.fullName}</p>
                                <p className="text-sm text-muted-foreground">{formData.phone}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formData.street}, {formData.ward}, {formData.district}, {formData.city}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Chưa chọn địa chỉ</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDialogOpen(true)}
                          className="flex-shrink-0"
                        >
                          Đổi địa chỉ
                        </Button>
                      </div>
                    </div>



                    <div className="border-t border-border pt-4 space-y-3">
                      <p className="font-semibold">Hình thức giao hàng</p>
                      <RadioGroup
                        value={formData.shippingMethod}
                        onValueChange={(val) => setFormData({ ...formData, shippingMethod: val })}
                      >
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="express" id="express" />
                          <Label htmlFor="express" className="flex-1 cursor-pointer">
                            <div className="font-medium">Giao nhanh 2-3 giờ</div>
                            <div className="text-sm text-muted-foreground">{systemSettings.expressShippingFee.toLocaleString('vi-VN')}₫</div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="standard" id="standard" />
                          <Label htmlFor="standard" className="flex-1 cursor-pointer">
                            <div className="font-medium">Giao tiêu chuẩn 1-3 ngày</div>
                            <div className="text-sm text-muted-foreground">{systemSettings.standardShippingFee.toLocaleString('vi-VN')}₫</div>
                          </Label>
                        </div>
                        {systemSettings.shippingMethods.filter(method => !['standard', 'express'].includes(method.id) && method.enabled).map(method => <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg"><RadioGroupItem value={method.id} id={`shipping-${method.id}`} /><Label htmlFor={`shipping-${method.id}`} className="flex-1 cursor-pointer"><div className="font-medium">{method.label}</div><div className="text-sm text-muted-foreground">{Number(method.fee).toLocaleString('vi-VN')}₫</div></Label></div>)}
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {step === "payment" && (
                  <div className="space-y-6">
                    <div>
                      <p className="font-semibold mb-4">Chọn phương thức thanh toán</p>
                    </div>
                    <RadioGroup
                      value={formData.paymentMethod}
                      onValueChange={(val) => {
                        setFormData({ ...formData, paymentMethod: val })
                        setWalletAgreementConfirmed(false)
                        if (val === "wallet") {
                          void checkWalletAgreement()
                        }
                      }}
                    >
                      {systemSettings.codEnabled && <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="flex-1 cursor-pointer">
                          <div className="font-medium">Thanh toán khi nhận hàng (COD)</div>
                          <div className="text-sm text-muted-foreground">Thanh toán tiền mặt khi nhận hàng</div>
                        </Label>
                      </div>}
                      {systemSettings.accountEnabled && <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="bank" id="bank" />
                        <Label htmlFor="bank" className="flex-1 cursor-pointer">
                          <div className="font-medium">Tài khoản</div>
                          <div className="text-sm text-muted-foreground">Chuyển khoản trước khi giao hàng</div>
                        </Label>
                      </div>}
                      {formData.paymentMethod === "__legacy_bank_details__" && (
                        <div className="mt-4 space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                            Thông tin chuyển khoản:
                          </p>
                          {Object.entries(
                            cartItems.reduce((acc, item) => {
                              if (!acc[item.vendorId]) {
                                acc[item.vendorId] = { vendorName: item.vendorName, items: [] }
                              }
                              acc[item.vendorId].items.push(item)
                              return acc
                            }, {} as Record<number, { vendorName: string; items: CheckoutItem[] }>)
                          ).map(([vendorId, { vendorName }]) => {
                            const banking = vendorBankingInfo[Number(vendorId)]
                            if (!banking || !banking.bankAccount || !banking.bankName) {
                              return (
                                <div key={vendorId} className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-200 dark:border-yellow-800">
                                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                    {vendorName}
                                  </p>
                                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                    Chưa có thông tin ngân hàng. Vui lòng liên hệ shop để được hướng dẫn thanh toán.
                                  </p>
                                </div>
                              )
                            }
                            return (
                              <div key={vendorId} className="p-3 bg-white dark:bg-slate-800 rounded border border-blue-200 dark:border-blue-700">
                                <p className="text-sm font-bold text-orange-600 mb-2">{vendorName}</p>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ngân hàng:</span>
                                    <span className="font-medium">{banking.bankName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Số tài khoản:</span>
                                    <span className="font-medium font-mono">{banking.bankAccount}</span>
                                  </div>
                                  {banking.bankBranch && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Chi nhánh:</span>
                                      <span className="font-medium">{banking.bankBranch}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                            Vui lòng chuyển khoản đúng số tiền và ghi chú mã đơn hàng sau khi đặt hàng.
                          </p>
                        </div>
                      )}
                      {systemSettings.walletEnabled && <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="wallet" id="wallet" />
                        <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                          <div className="font-medium">Ví điện tử</div>
                          <div className="text-sm text-muted-foreground">Sử dụng ví TMĐT</div>
                        </Label>
                      </div>}
                      {systemSettings.paymentMethods.filter(method => !['cod', 'bank', 'wallet'].includes(method.id) && method.enabled).map(method => <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg"><RadioGroupItem value={method.id} id={`payment-${method.id}`} /><Label htmlFor={`payment-${method.id}`} className="flex-1 cursor-pointer"><div className="font-medium">{method.label}</div><div className="text-sm text-muted-foreground">Thanh toán theo hướng dẫn của shop</div></Label></div>)}
                    </RadioGroup>
                  </div>
                )}

                {/*
                  <div className="space-y-4">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">Chuyển khoản đúng số tiền cho từng shop, sau đó tải ảnh xác nhận giao dịch. Shop là bên duyệt thanh toán cuối cùng.</div>
                    {vendorGroups.map(([vendorId, group]) => {
                      const id = Number(vendorId); const banking = vendorBankingInfo[id]; const proof = paymentProofs[id]
                      const amount = getVendorSubtotal(id) + shippingCostPerVendor - (vendorVouchers[id]?.discountAmount || 0)
                      return <section key={vendorId} className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/40">
                        <div className="flex items-center justify-between border-b border-blue-100 bg-white px-4 py-3 dark:border-blue-900 dark:bg-slate-950"><div><p className="font-semibold">Thanh toán cho {group.vendorName}</p><p className="text-sm text-muted-foreground">Số tiền: <b className="text-blue-700 dark:text-blue-300">{amount.toLocaleString('vi-VN')}₫</b></p></div><CreditCard className="h-5 w-5 text-blue-600" /></div>
                        <div className="space-y-3 p-4 text-sm">
                          {formData.paymentMethod === 'wallet' && banking?.walletQrUrl ? <img src={banking.walletQrUrl} alt={`Mã QR ví ${group.vendorName}`} className="mx-auto h-44 w-44 rounded-lg border bg-white object-contain p-2" /> : formData.paymentMethod === 'wallet' && banking?.walletAccount ? <div className="rounded-lg border border-blue-100 bg-white p-3 dark:border-blue-900 dark:bg-slate-950"><p className="font-medium">{banking.walletProvider || 'Ví điện tử'} · {banking.walletAccount}</p><p className="mt-1 text-xs text-muted-foreground">Nội dung: <b>ĐƠN HÀNG {group.vendorName}</b></p></div> : banking?.bankName && banking?.bankAccount ? <div className="rounded-lg border border-blue-100 bg-white p-3 dark:border-blue-900 dark:bg-slate-950"><p className="font-medium">{banking.bankName} · {banking.bankAccount}</p><p className="mt-1 text-xs text-muted-foreground">Nội dung: <b>ĐƠN HÀNG {group.vendorName}</b></p></div> : <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">Shop chưa cấu hình tài khoản nhận tiền. Vui lòng liên hệ shop.</p>}
                          {formData.paymentMethod === 'bank' && banking?.bankBin && banking?.bankAccount && <img src={`https://img.vietqr.io/image/${banking.bankBin}-${banking.bankAccount}-compact2.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(`CHECKOUT-${id}`)}`} alt={`Mã QR thanh toán ${group.vendorName}`} className="mx-auto h-44 w-44 rounded-lg border bg-white object-contain p-2" />}
                          {formData.paymentMethod !== 'cod' && <div className="overflow-hidden rounded-lg border border-blue-100 bg-white dark:border-blue-900 dark:bg-slate-950">
                            {[["Số tiền", `${amount.toLocaleString('vi-VN')}₫`, String(Math.round(amount))], ["Nội dung", `CHECKOUT-${id}`, `CHECKOUT-${id}`], ["Tài khoản", formData.paymentMethod === 'wallet' ? banking?.walletAccount || '' : banking?.bankAccount || '', formData.paymentMethod === 'wallet' ? banking?.walletAccount || '' : banking?.bankAccount || '']].map(([label, value, copy]) => <div key={label} className="flex items-center gap-2 border-b border-blue-50 px-3 py-2 last:border-0"><span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span><span className="min-w-0 flex-1 break-all font-medium">{value}</span><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-blue-700" disabled={!copy} onClick={() => copyPaymentValue(copy, label)} aria-label={`Sao chép ${label}`}><Copy className="h-3.5 w-3.5" /></Button></div>)}
                          </div>}
                          <Label htmlFor={`proof-${id}`} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-blue-300 bg-white px-4 py-3 font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:bg-slate-950"><Upload className="h-4 w-4" />{proof?.checking ? 'Đang kiểm tra ảnh...' : proof?.verified ? 'Đổi ảnh minh chứng' : 'Tải ảnh minh chứng'}</Label>
                          <Input id={`proof-${id}`} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void selectPaymentProof(id, e.target.files?.[0])} />
                          {proof?.preview && <div className="flex items-center gap-3 rounded-lg border bg-white p-2 dark:bg-slate-950"><img src={proof.preview} alt={`Minh chứng thanh toán ${group.vendorName}`} className="h-20 w-20 rounded object-cover" /><p className={proof.verified ? 'text-sm font-medium text-emerald-600' : 'text-sm font-medium text-rose-600'}>{proof.verified ? 'Ảnh giao dịch đã được kiểm tra, sẵn sàng.' : 'Ảnh chưa đạt kiểm tra. Hãy chọn ảnh khác.'}</p></div>}
                        </div>
                      </section>
                    })}
                  </div>
                */}
                {step === "review" && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Kiểm tra lại thông tin trước khi đặt hàng
                      </p>
                    </div>
                    <div className="border-b border-border pb-3">
                      <p className="font-semibold mb-2">Địa chỉ giao hàng</p>
                      <p className="text-sm">
                        {formData.fullName} | {formData.phone}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formData.street}, {formData.ward}, {formData.district}, {formData.city}
                      </p>
                    </div>

                    {Object.keys(vendorVouchers).length > 0 && (
                      <div className="border-b border-border pb-3">
                        <p className="font-semibold mb-2">Voucher đã áp dụng</p>
                        <div className="space-y-2">
                          {Object.entries(vendorVouchers).map(([vendorId, voucher]) => (
                            <div key={vendorId} className="flex justify-between text-sm p-2 bg-green-50 dark:bg-green-950 rounded">
                              <span className="text-green-800 dark:text-green-200 font-medium">{voucher.code}</span>
                              <span className="text-green-700 dark:text-green-300">-{voucher.discountAmount.toLocaleString('vi-VN')}₫</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="border-b border-border pb-3">
                      <p className="font-semibold mb-2">Phương thức thanh toán</p>
                      <p className="text-sm">
                        {formData.paymentMethod === "cod"
                          ? "Thanh toán khi nhận hàng"
                          : formData.paymentMethod === "bank"
                            ? "Tài khoản"
                            : formData.paymentMethod === "wallet"
                              ? "Ví điện tử"
                              : systemSettings.paymentMethods.find(method => method.id === formData.paymentMethod)?.label || formData.paymentMethod}
                      </p>
                      {formData.paymentMethod === "bank" && (
                        <div className="mt-3 space-y-2">
                          {Object.entries(
                            cartItems.reduce((acc, item) => {
                              if (!acc[item.vendorId]) {
                                acc[item.vendorId] = { vendorName: item.vendorName, items: [] }
                              }
                              acc[item.vendorId].items.push(item)
                              return acc
                            }, {} as Record<number, { vendorName: string; items: CheckoutItem[] }>)
                          ).map(([vendorId, { vendorName }]) => {
                            const banking = vendorBankingInfo[Number(vendorId)]
                            if (!banking || !banking.bankAccount || !banking.bankName) return null
                            return (
                              <div key={vendorId} className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                                <p className="font-medium">{vendorName}: {banking.bankName} - {banking.bankAccount}</p>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(
                    cartItems.reduce((acc, item) => {
                      if (!acc[item.vendorId]) {
                        acc[item.vendorId] = { vendorName: item.vendorName, items: [] }
                      }
                      acc[item.vendorId].items.push(item)
                      return acc
                    }, {} as Record<number, { vendorName: string; items: CheckoutItem[] }>)
                  ).map(([vendorId, { vendorName, items: vendorItems }]) => {
                    const vendorIdNum = Number(vendorId)
                    const hasVoucher = vendorVouchers[vendorIdNum]
                    return (
                      <div key={vendorId} className="pb-4 border-b border-border last:border-b-0 last:pb-0">
                        <p className="text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-950 px-2 py-1 rounded mb-3 inline-block">
                          {vendorName}
                        </p>
                        <div className="space-y-3 mb-4">
                          {vendorItems.map((item) => (
                            <div key={item.id} className="flex gap-3">
                              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                <Image
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.productName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 flex justify-between text-sm">
                                <div>
                                  <p className="font-medium line-clamp-2">{item.productName}</p>
                                  {item.variantName && (
                                    <p className="text-xs text-gray-500 mt-0.5">Phân loại: {item.variantName}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">x{item.quantity}</p>
                                </div>
                                {(() => {
                                  const priced = computePrice({
                                    basePrice: item.basePrice ?? item.price,
                                    originalPrice: item.originalPrice,
                                    salePrice: item.salePrice,
                                    taxApplied: item.taxApplied,
                                    taxRate: item.taxRate,
                                  })
                                  return <p className="font-medium text-right">{(priced.displayPrice * item.quantity).toLocaleString("vi-VN")}₫</p>
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>

                        {step === "payment" && (
                          <div className="pt-3 border-t border-border space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                              <Tag className="h-3 w-3" /> Voucher
                            </p>
                            {hasVoucher ? (
                              <div className="flex gap-2 items-start">
                                <div className="flex-1 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-2">
                                  <p className="text-xs font-bold text-green-700 dark:text-green-300">{hasVoucher.code}</p>
                                  <p className="text-xs text-green-600 dark:text-green-400">-{hasVoucher.discountAmount.toLocaleString('vi-VN')}₫</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveVoucher(vendorIdNum)}
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2 items-end">
                                  <Input
                                    placeholder="Nhập mã"
                                    value={voucherInputs[vendorIdNum] || ''}
                                    onChange={(e) => setVoucherInputs(prev => ({ ...prev, [vendorIdNum]: e.target.value }))}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') handleApplyVoucher(vendorIdNum)
                                    }}
                                    className="text-xs h-8"
                                    disabled={voucherLoading[vendorIdNum]}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleApplyVoucher(vendorIdNum)}
                                    disabled={voucherLoading[vendorIdNum] || !voucherInputs[vendorIdNum]?.trim()}
                                    className="h-8 text-xs"
                                  >
                                    {voucherLoading[vendorIdNum] ? 'Đang...' : 'Dùng'}
                                  </Button>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (showVoucherList[vendorIdNum]) {
                                      setShowVoucherList(prev => ({ ...prev, [vendorIdNum]: false }))
                                    } else {
                                      fetchPublicVouchers(vendorIdNum)
                                      setShowVoucherList(prev => ({ ...prev, [vendorIdNum]: true }))
                                    }
                                  }}
                                  className="w-full h-8 text-xs"
                                >
                                  {showVoucherList[vendorIdNum] ? '▼ Ẩn danh sách' : '▶ Xem danh sách shop'}
                                </Button>
                                {showVoucherList[vendorIdNum] && (
                                  <div className="border rounded bg-white dark:bg-slate-700 max-h-40 overflow-y-auto">
                                    {publicVouchers[vendorIdNum]?.length > 0 ? (
                                      <div className="divide-y">
                                        {publicVouchers[vendorIdNum].map(v => (
                                          <button
                                            key={v.id}
                                            onClick={() => handleSelectVoucher(vendorIdNum, v)}
                                            disabled={voucherLoading[vendorIdNum]}
                                            className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 text-xs"
                                          >
                                            <p className="font-semibold text-blue-600 dark:text-blue-400">{v.code}</p>
                                            <p className="text-gray-600 dark:text-gray-300 text-xs">
                                              Giảm {v.discountValue}{v.discountType === 'percentage' ? '%' : '₫'}
                                            </p>
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-3 text-center text-xs text-gray-500">Không có voucher</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {step === "review" && hasVoucher && (
                          <div className="pt-3 border-t border-border">
                            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-2">
                              <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                                <Tag className="h-3 w-3" /> Voucher
                              </p>
                              <p className="text-xs font-bold text-green-700 dark:text-green-300">{hasVoucher.code}</p>
                              <p className="text-xs text-green-600 dark:text-green-400">-{hasVoucher.discountAmount.toLocaleString('vi-VN')}₫</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-2 text-sm border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{subtotal.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vận chuyển ({uniqueVendors} shop)</span>
                    <span>{totalShippingCost.toLocaleString("vi-VN")}₫</span>
                  </div>
                  {totalVoucherDiscount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span className="text-muted-foreground">Giảm giá voucher</span>
                      <span>-{totalVoucherDiscount.toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t border-border pt-3">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{total.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {step === "review" ? (
              <div className="space-y-2">
                  <p className="text-sm font-semibold leading-6 text-foreground">
                    Bằng cách nhấn nút Đặt hàng, bạn đồng ý với các{' '}
                    <Link href="/api/legal-documents/view/website-operating-conditions" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">Điều kiện hoạt động</Link> của website.
                  </p>
                  <Button className="h-10 w-full" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Đang xử lý..." : "Đặt hàng"}
                  </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button className="w-full" onClick={handleSubmit} disabled={loading}>Tiếp tục</Button>
              </div>
            )}
        </div>

        <CheckoutAddressDialog
          userId={userId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          selectedAddressId={selectedAddressId}
          onSelectAddress={handleSelectAddress}
        />
        <Dialog open={consentDialog === "wallet"} onOpenChange={(open) => !open && !savingConsent && setConsentDialog(null)}>
          <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg" showCloseButton={!loading && !savingConsent}>
            <DialogHeader>
              <DialogTitle>Xác nhận thanh toán qua ví điện tử</DialogTitle>
              <DialogDescription>Vui lòng xem hợp đồng trước khi tiếp tục thanh toán.</DialogDescription>
            </DialogHeader>
            <div className="rounded-md border bg-muted/30 p-4 text-sm leading-6">
              <p className="text-muted-foreground">Nhấn vào liên kết dưới đây để xem Hợp đồng trung gian thanh toán.</p>
              <Link
                href="/api/legal-documents/view/intermediary-payment-agreement"
                className="mt-3 inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Xem Hợp đồng trung gian thanh toán
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <DialogFooter>
              <Button variant="outline" disabled={!!savingConsent} onClick={() => setConsentDialog(null)}>Hủy</Button>
              <Button disabled={!!savingConsent} onClick={() => savePolicyAcceptance("wallet")}>{savingConsent === "wallet" ? "Đang lưu..." : "Tôi đã đọc và xác nhận"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={consentDialog === "terms"} onOpenChange={(open) => !open && !savingConsent && setConsentDialog(null)}>
          <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg" showCloseButton={!loading && !savingConsent}>
            <DialogHeader>
              <DialogTitle>Xác nhận điều kiện hoạt động</DialogTitle>
              <DialogDescription>Đơn hàng chỉ được tạo sau khi bạn xác nhận đã đọc các điều kiện dưới đây.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[48vh] space-y-3 overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm leading-6">
              <p>Bạn xác nhận đã đọc và đồng ý với các điều kiện hoạt động của website áp dụng cho đơn hàng này.</p>
              <p>Vui lòng tham khảo <Link href="/api/legal-documents/view/website-operating-conditions" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">Điều kiện hoạt động</Link> để xem nội dung đầy đủ.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" disabled={!!savingConsent} onClick={() => setConsentDialog(null)}>Hủy</Button>
              <Button disabled={!!savingConsent} onClick={() => savePolicyAcceptance("terms")}>{savingConsent === "terms" ? "Đang lưu..." : "Tôi đã đọc và đồng ý"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={!!proofConfirmation} onOpenChange={(open) => !open && closeProofConfirmation()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Xác nhận gửi minh chứng</DialogTitle>
              <DialogDescription>Hãy kiểm tra ảnh thuộc đúng đơn và hiển thị rõ số tiền, nội dung chuyển khoản cùng thời gian giao dịch.</DialogDescription>
            </DialogHeader>
            {proofConfirmation && <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900"><p>Đơn hàng: <b className="font-mono">{proofConfirmation.order.orderNumber}</b></p><p className="mt-1">Số tiền: <b>{Number(proofConfirmation.order.total).toLocaleString('vi-VN')}₫</b></p></div>
              <Label htmlFor="post-order-proof-file" className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-blue-300 bg-white px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50"><Upload className="h-4 w-4" />{proofConfirmation.file ? 'Chọn ảnh khác' : 'Chọn ảnh minh chứng'}</Label>
              <Input id="post-order-proof-file" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { selectPostOrderProof(event.target.files?.[0]); event.currentTarget.value = '' }} />
              {proofConfirmation.previewUrl ? <img src={proofConfirmation.previewUrl} alt="Xem trước minh chứng thanh toán" className="max-h-72 w-full rounded-lg border bg-white object-contain" /> : <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">Chưa chọn ảnh minh chứng.</p>}
            </div>}
            <DialogFooter>
              <Button variant="outline" onClick={closeProofConfirmation}>Hủy</Button>
              <Button disabled={!proofConfirmation?.file} onClick={() => void confirmPostOrderProof()}>Xác nhận gửi minh chứng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}

interface CreatedOrderPayment {
  id: number
  orderNumber: string
  total: number
  date?: string
  paymentMethod: string
  paymentStatus?: string | null
  paymentProofUrl?: string | null
  Vendor?: { id: number; name: string; bankAccount?: string | null; bankName?: string | null; bankCode?: string | null; bankBin?: string | null; walletProvider?: string | null; walletAccount?: string | null; walletQrUrl?: string | null }
}

const getBankQr = (order: CreatedOrderPayment) => {
  const bin = order.Vendor?.bankBin
  return bin && order.Vendor?.bankAccount ? `https://img.vietqr.io/image/${bin}-${order.Vendor.bankAccount}-compact2.png?amount=${Math.round(order.total)}&addInfo=${encodeURIComponent(order.orderNumber)}` : null
}


export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="container-viewport py-8"><p className="text-muted-foreground">Đang tải thanh toán...</p></main>}>
      <CheckoutContent />
    </Suspense>
  )
}
