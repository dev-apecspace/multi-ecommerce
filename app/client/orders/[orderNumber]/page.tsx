"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Truck, Star, CreditCard, Wallet, Download, Copy, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useLoading } from "@/hooks/use-loading"
import { useRealtimeOrder } from "@/hooks/use-realtime-order"
import { CreateReturnModal } from "@/components/returns/create-return-modal"
import { ReturnStatusModal } from "@/components/returns/return-status-modal"
import { ReviewModal } from "@/components/review/review-modal"
import { QrSaveButton } from '@/components/client/qr-save-button'
import { orderStatusConfig } from '@/lib/order-status'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaymentProofProgress } from '@/components/client/payment-proof-progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface OrderItem {
  id: number
  quantity: number
  price: number
  vendorId: number
  variantId: number | null
  variantName?: string | null
  productId: number
  Product: { id: number; name: string; image?: string }
  ProductVariant?: { id: number; name: string; image?: string } | null
}

interface Order {
  id: number
  orderNumber: string
  status: string
  total: number
  date: string
  updatedAt: string
  paymentMethod: string
  paymentStatus?: string
  paymentProofUrl?: string | null
  paymentSubmittedAt?: string | null
  shippingAddress: string
  Vendor: { id: number; name: string; bankAccount?: string | null; bankName?: string | null; bankCode?: string | null; bankBin?: string | null; bankBranch?: string | null; walletProvider?: string | null; walletAccount?: string | null; walletQrUrl?: string | null }
  OrderItem: OrderItem[]
}

interface ReturnModalState {
  open: boolean
  orderId: number | null
  orderItemId: number | null
  productId: number
  variantId: number | null
  productName: string
  productImage?: string
  quantity: number
  price: number
}

const getOrderQr = (order: Order) => {
  if (order.paymentMethod === 'wallet') return order.Vendor?.walletQrUrl || null
  const bankBin = order.Vendor?.bankBin
  return bankBin && order.Vendor?.bankAccount
    ? `https://img.vietqr.io/image/${bankBin}-${order.Vendor.bankAccount}-compact2.png?amount=${Math.round(order.total)}&addInfo=${encodeURIComponent(order.orderNumber)}`
    : null
}


const isReturnable = (order: Order) => {
  if (order.status !== 'delivered') return false
  const deliveryDate = new Date(order.updatedAt)
  const currentDate = new Date()
  const diffTime = Math.abs(currentDate.getTime() - deliveryDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 3
}

interface PageProps {
  params: Promise<{ orderNumber: string }>
}

export default function OrderDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { setIsLoading } = useLoading()
  const resolvedParams = use(params)
  const orderNumber = decodeURIComponent(resolvedParams.orderNumber)

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [returnStatuses, setReturnStatuses] = useState<Record<number, string>>({})
  const [returnModal, setReturnModal] = useState<ReturnModalState>({
    open: false,
    orderId: null,
    orderItemId: null,
    productId: 0,
    variantId: null,
    productName: '',
    productImage: '',
    quantity: 1,
    price: 0
  })
  const [returnStatusModal, setReturnStatusModal] = useState({
    open: false,
    orderItemId: 0
  })
  const [reviewModal, setReviewModal] = useState<{
    open: boolean
    productId: number | null
    productName: string
    orderId: number | null
    reviewId: number | null
    initialRating: number | null
    initialComment: string | null
  }>({
    open: false,
    productId: null,
    productName: '',
    orderId: null,
    reviewId: null,
    initialRating: null,
    initialComment: null
  })
  const [orderReviews, setOrderReviews] = useState<Record<number, { id: number; rating: number; comment: string | null; createdAt: string }>>({})
  const [proofSubmitting, setProofSubmitting] = useState(false)
  const [proofConfirmation, setProofConfirmation] = useState<{ file: File | null; previewUrl: string | null } | null>(null)
  const [proofOcr, setProofOcr] = useState<{ checking: boolean; status?: string; reason?: string }>({ checking: false })
  const paymentProofOcrEnabled = process.env.NEXT_PUBLIC_PAYMENT_PROOF_OCR_ENABLED !== 'false'

  const copyPaymentValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast({ title: `Đã sao chép ${label}` })
    } catch {
      toast({ title: 'Không thể sao chép', description: 'Vui lòng sao chép thủ công.', variant: 'destructive' })
    }
  }

  const submitPaymentProof = async (file?: File) => {
    if (!file || !order || !userId) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({ title: 'Ảnh chưa hợp lệ', description: 'Chỉ nhận JPG, PNG, WEBP tối đa 5MB.', variant: 'destructive' })
      return
    }
    try {
      setProofSubmitting(true)
      const body = new FormData(); body.append('file', file); body.append('userId', String(userId))
      const response = await fetch(`/api/client/orders/by-number/${encodeURIComponent(order.orderNumber)}/payment-proof`, { method: 'POST', body, credentials: 'include' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không thể gửi minh chứng.')
      toast({ title: 'Đã gửi minh chứng', description: result.data?.verification?.status === 'review' ? 'Ảnh đã được gửi để shop đối soát thủ công.' : 'Shop sẽ đối soát thanh toán của bạn.' })
      fetchOrder()
    } catch (error) {
      toast({ title: 'Chưa thể gửi minh chứng', description: error instanceof Error ? error.message : 'Vui lòng thử lại.', variant: 'destructive' })
    } finally {
      setProofSubmitting(false)
    }
  }

  const openProofConfirmation = () => { setProofConfirmation({ file: null, previewUrl: null }); setProofOcr({ checking: false }) }
  const selectProofFile = async (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({ title: 'Ảnh chưa hợp lệ', description: 'Chỉ nhận JPG, PNG, WEBP tối đa 5MB.', variant: 'destructive' })
      return
    }
    setProofConfirmation(current => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl)
      return { file, previewUrl: URL.createObjectURL(file) }
    })
    if (!order) return
    if (!paymentProofOcrEnabled) {
      setProofOcr({ checking: false })
      return
    }
    setProofOcr({ checking: true })
    try {
      const body = new FormData()
      body.append('file', file); body.append('orderNumber', order.orderNumber); body.append('amount', String(order.total)); body.append('orderCreatedAt', order.date)
      const response = await fetch('/api/client/payment-proof/preflight', { method: 'POST', body })
      const result = await response.json().catch(() => null)
      const verification = result?.data?.verification || result?.verification
      setProofOcr({ checking: false, status: verification?.status || 'error', reason: verification?.reason || result?.error || 'Không thể kiểm tra ảnh.' })
    } catch {
      setProofOcr({ checking: false, status: 'error', reason: 'Không thể kết nối dịch vụ kiểm tra ảnh. Vui lòng thử lại.' })
    }
  }
  const closeProofConfirmation = () => setProofConfirmation(current => {
    if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl)
    return null
  })
  const confirmPaymentProof = async () => {
    const file = proofConfirmation?.file
    if (!file) return
    closeProofConfirmation()
    await submitPaymentProof(file)
  }

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id)
    } else {
      const storedUserId = localStorage.getItem('userId')
      if (storedUserId) {
        setUserId(parseInt(storedUserId))
      }
    }
  }, [user])

  useEffect(() => {
    if (userId && orderNumber) {
      fetchOrder()
    }
  }, [userId, orderNumber])

  useRealtimeOrder({ 
    orderId: order?.id ?? null,
    onUpdate: () => { if (userId && order) fetchOrder() }
  })

  const fetchOrderReturns = async (currentUserId: number, currentOrderId: number) => {
    try {
      const response = await fetch(`/api/client/returns?userId=${currentUserId}&orderId=${currentOrderId}&limit=100`)
      if (!response.ok) {
        setReturnStatuses({})
        return
      }
      const result = await response.json()
      const map: Record<number, string> = {}
      if (Array.isArray(result.data)) {
        result.data.forEach((ret: any) => {
          if (ret?.orderItemId && ret.status && ret.status !== 'rejected' && ret.status !== 'cancelled') {
            map[ret.orderItemId] = ret.status
          }
        })
      }
      setReturnStatuses(map)
    } catch {
      setReturnStatuses({})
    }
  }

  const fetchOrderReviews = async (currentUserId: number, currentOrderId: number) => {
    try {
      const response = await fetch(`/api/reviews?userId=${currentUserId}&orderId=${currentOrderId}`)
      if (!response.ok) {
        setOrderReviews({})
        return
      }
      const result = await response.json()
      if (Array.isArray(result.data)) {
        const map: Record<number, { id: number; rating: number; comment: string | null; createdAt: string }> = {}
        result.data.forEach((review: any) => {
          if (review?.productId) {
            map[review.productId] = {
              id: review.id,
              rating: review.rating,
              comment: review.comment || null,
              createdAt: review.createdAt
            }
          }
        })
        setOrderReviews(map)
      } else {
        setOrderReviews({})
      }
    } catch {
      setOrderReviews({})
    }
  }

  const fetchOrder = async () => {
    try {
      setIsLoading(true)
      setLoading(true)
      const response = await fetch(`/api/client/orders/by-number/${encodeURIComponent(orderNumber)}?userId=${userId}`)
      const result = await response.json()
      const foundOrder = result.data as Order | undefined
      if (foundOrder) {
        setOrder(foundOrder)
        void fetchOrderReturns(userId!, foundOrder.id)
        void fetchOrderReviews(userId!, foundOrder.id)
      } else {
        toast({ title: 'Lỗi', description: 'Không tìm thấy đơn hàng', variant: 'destructive' })
        router.push('/client/order-history')
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể tải thông tin đơn hàng', variant: 'destructive' })
    } finally {
      setLoading(false)
      setIsLoading(false)
    }
  }

  const handleOpenReturnModal = (orderId: number, item: OrderItem) => {
    if (returnStatuses[item.id]) {
      toast({ title: 'Thông báo', description: 'Đã gửi yêu cầu đổi/trả cho sản phẩm này' })
      return
    }

    const displayImage = item.ProductVariant?.image || item.Product.image || '/placeholder.svg'
    const productName = (item.variantName || item.ProductVariant)
      ? `${item.Product.name} - ${item.variantName || item.ProductVariant?.name}`
      : item.Product.name
    
    setReturnModal({
      open: true,
      orderId,
      orderItemId: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName,
      productImage: displayImage,
      quantity: item.quantity,
      price: item.price
    })
  }

  const canReviewOrder = (order: Order) => order.status === 'completed'

  const getProductDisplayName = (item: OrderItem) => {
    const variantLabel = item.variantName || item.ProductVariant?.name
    return variantLabel ? `${item.Product.name} - ${variantLabel}` : item.Product.name
  }

  const handleOpenReviewModal = (orderId: number, item: OrderItem, existingReview?: { id: number; rating: number; comment: string | null }) => {
    setReviewModal({
      open: true,
      productId: item.Product.id,
      productName: getProductDisplayName(item),
      orderId,
      reviewId: existingReview?.id ?? null,
      initialRating: existingReview?.rating ?? null,
      initialComment: existingReview?.comment ?? null
    })
  }

  const handleConfirmReceipt = async () => {
    if (!order) return
    try {
      setIsLoading(true)
      setConfirming(true)
      const response = await fetch(`/api/client/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          status: 'completed'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Không thể xác nhận nhận hàng')
      }

      toast({
        title: 'Thành công',
        description: 'Bạn đã xác nhận nhận hàng. Cảm ơn bạn!'
      })
      
      await fetchOrder()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể xác nhận nhận hàng',
        variant: 'destructive'
      })
    } finally {
      setConfirming(false)
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="container-viewport py-8">
        <p className="text-center">Đang tải thông tin đơn hàng...</p>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="container-viewport py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Không tìm thấy đơn hàng</p>
            <Button onClick={() => router.push('/client/order-history')}>
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const shippingAddressData = (() => {
    try {
      return JSON.parse(order.shippingAddress || '{}')
    } catch {
      return {}
    }
  })()

  const getOrderStatusKey = () => {
    const returnStatusValues = Object.values(returnStatuses)
    
    if (returnStatusValues.length > 0) {
      const latestReturnStatus = returnStatusValues[0]
      
      if (['shipped', 'received', 'restocked'].includes(latestReturnStatus)) {
        return 'return_shipped'
      }
      
      if (latestReturnStatus === 'pending') {
        return 'return_pending'
      }
      
      if (latestReturnStatus === 'approved') {
        return 'return_approved'
      }
      
      if (latestReturnStatus === 'refund_confirmed') {
        return 'return_refund_confirmed'
      }
      
      if (latestReturnStatus === 'completed') {
        return 'returned'
      }
    }

    return order.status
  }

  const returnStatusValues = Object.values(returnStatuses)
  const hasActiveReturn = returnStatusValues.some((status) => status !== 'completed')
  const shouldDisableConfirm = returnStatusValues.length > 0
  const statusKey = getOrderStatusKey()

  return (
    <main className="container-viewport client-order-detail py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <h1 className="text-3xl font-bold mb-2">Chi tiết đơn hàng</h1>
        <p className="text-muted-foreground">Mã đơn: {order.orderNumber}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Trạng thái đơn hàng</CardTitle>
                <Badge className={orderStatusConfig[statusKey]?.color || orderStatusConfig.pending.color}>
                  {orderStatusConfig[statusKey]?.label || statusKey}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Ngày đặt hàng: {new Date(order.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>
                  Phương thức thanh toán: {order.paymentMethod === 'cod'
                    ? 'Thanh toán khi nhận hàng'
                    : order.paymentMethod === 'bank'
                      ? 'Chuyển khoản ngân hàng'
                      : order.paymentMethod === 'wallet'
                        ? 'Ví điện tử'
                        : order.paymentMethod}
                </p>
              </div>
              {['bank', 'wallet'].includes(order.paymentMethod) && (order.paymentStatus === 'paid' ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Đã được shop xác nhận thanh toán.</div>
              ) : (
                <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h3 className="font-semibold text-slate-900 dark:text-slate-100">Thông tin thanh toán</h3>{!(order.paymentMethod === 'wallet' && !getOrderQr(order)) && <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">{order.paymentMethod === 'wallet' ? `${order.Vendor?.walletProvider || 'Ví điện tử'} · ${order.Vendor?.walletAccount || 'Chưa có thông tin ví'}` : `${order.Vendor?.bankName || 'Ngân hàng'} · ${order.Vendor?.bankAccount || 'Chưa có số tài khoản'}`}</p>}</div>
                    {order.paymentMethod === 'wallet' ? <Wallet className="h-5 w-5 text-blue-600" /> : <CreditCard className="h-5 w-5 text-blue-600" />}
                  </div>
                  {order.paymentStatus === 'submitted' ? order.paymentProofUrl ? <div className="my-4"><p className="mb-2 text-center text-sm font-semibold text-amber-800">Ảnh minh chứng giao dịch</p><a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="mx-auto block w-fit overflow-hidden rounded-lg border bg-white"><img src={order.paymentProofUrl} alt={`Minh chứng thanh toán ${order.orderNumber}`} className="max-h-72 max-w-full object-contain" /></a></div> : <p className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Đã gửi xác nhận thanh toán, đang chờ shop đối soát.</p> : getOrderQr(order) ? <img src={getOrderQr(order)!} alt={`Mã QR thanh toán ${order.orderNumber}`} className="mx-auto my-4 h-52 w-52 rounded-lg border bg-white object-contain p-2" /> : order.paymentMethod === 'wallet' ? <div className="my-4 overflow-hidden rounded-xl border border-blue-200 bg-white text-sm shadow-sm dark:border-blue-900 dark:bg-slate-950">
                    <div className="border-b border-blue-100 bg-blue-100/70 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-200">Thanh toán thủ công qua ví</div>
                    {[
                      ['Ví điện tử', order.Vendor?.walletProvider || 'Chưa có thông tin ví', order.Vendor?.walletProvider || ''],
                      ['Số tài khoản / SĐT', order.Vendor?.walletAccount || 'Chưa có số nhận tiền', order.Vendor?.walletAccount || ''],
                      ['Số tiền', `${Number(order.total).toLocaleString('vi-VN')}₫`, String(Math.round(Number(order.total)))],
                      ['Nội dung', order.orderNumber, order.orderNumber],
                    ].map(([label, displayValue, copyValue], index) => <div key={label} className={`flex min-w-0 items-center gap-3 border-b border-blue-50 px-3 py-2.5 last:border-0 dark:border-blue-950 ${index === 2 ? 'bg-blue-50/80 dark:bg-blue-950/30' : ''}`}><span className="w-28 shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span><span className={`min-w-0 flex-1 break-all text-slate-900 dark:text-slate-100 ${index === 2 ? 'text-base font-bold text-blue-800 dark:text-blue-200' : 'font-semibold'}`}>{displayValue}</span><Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 border border-blue-100 bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-900 dark:bg-slate-900" onClick={() => copyPaymentValue(copyValue, label)} disabled={!copyValue} aria-label={`Sao chép ${label}`}><Copy className="h-4 w-4" /></Button></div>)}
                  </div> : <p className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Shop chưa cấu hình thông tin nhận tiền. Vui lòng liên hệ shop để được hỗ trợ.</p>}
                  {!(order.paymentMethod === 'wallet' && !getOrderQr(order) && order.paymentStatus !== 'submitted') && <div className="grid gap-1 text-sm sm:grid-cols-2"><p>Số tiền: <b>{Number(order.total).toLocaleString('vi-VN')}₫</b></p><p>Nội dung: <b className="font-mono">{order.orderNumber}</b></p></div>}
                  <p className="mt-3 rounded-md bg-white/80 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">Lưu ý: Hãy chụp màn hình giao dịch để đối soát trước khi gửi xác nhận thanh toán.</p>
                  <PaymentProofProgress status={order.paymentStatus} />
                  {order.paymentStatus !== 'submitted' && order.paymentMethod === 'bank' && getOrderQr(order) ? <QrSaveButton orderId={order.id} orderNumber={order.orderNumber} /> : null}
                  {order.paymentStatus === 'submitted' ? <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">Đã gửi minh chứng — chờ shop xác nhận.</div> : order.paymentStatus !== 'paid' ? <div className="mt-3"><Button type="button" variant="outline" className="w-full border-dashed border-blue-300 bg-white text-blue-700 hover:bg-blue-50 dark:bg-slate-950" disabled={proofSubmitting} onClick={openProofConfirmation}><Upload className="mr-2 h-4 w-4" />{proofSubmitting ? 'Đang gửi minh chứng...' : 'Tải ảnh minh chứng thanh toán'}</Button><p className="mt-2 text-xs text-muted-foreground">Ảnh sẽ được shop đối soát; ảnh thiếu thông tin vẫn có thể cần kiểm tra thủ công.</p></div> : <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Đã được xác nhận thanh toán.</div>}
                </section>
              ))}
              {order.status === 'delivered' && (
                <>
                  <Button 
                    onClick={handleConfirmReceipt}
                    disabled={confirming || shouldDisableConfirm}
                    className="w-full"
                  >
                    {confirming ? 'Đang xác nhận...' : 'Xác nhận đã nhận hàng'}
                  </Button>
                  {shouldDisableConfirm && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                      <p className="text-sm text-purple-800 dark:text-purple-400 mb-2">
                        {hasActiveReturn
                          ? 'Đơn hàng này đang có yêu cầu đổi/trả, không thể xác nhận hoàn thành.'
                          : 'Đơn hàng này đã được xử lý đổi/trả, không thể xác nhận hoàn thành.'}
                      </p>
                      {Object.entries(returnStatuses).map(([itemId]) => {
                        const item = order.OrderItem.find(i => i.id === parseInt(itemId))
                        if (!item) return null
                        return (
                          <Button
                            key={itemId}
                            variant="outline"
                            size="sm"
                            className="w-full text-purple-600 hover:text-purple-700 border-purple-200 hover:bg-purple-50"
                            onClick={() => setReturnStatusModal({ open: true, orderItemId: parseInt(itemId) })}
                          >
                            Xem trạng thái trả hàng
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Vendor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Nhà bán hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{order.Vendor?.name || 'Đang tải...'}</p>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm trong đơn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.OrderItem.map((item) => {
                  const displayImage = item.ProductVariant?.image || item.Product.image || '/placeholder.svg'
                  const itemReturnStatus = returnStatuses[item.id]
                  const itemHasReturnRecord = Boolean(itemReturnStatus)
                  const productReview = orderReviews[item.Product.id]
                  return (
                    <div key={item.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex min-w-0 gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                          <Image
                            src={displayImage}
                            alt={item.Product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-medium line-clamp-2">
                                {item.Product.name}
                                {(item.variantName || item.ProductVariant?.name) && ` - ${item.variantName || item.ProductVariant?.name}`}
                              </p>
                              <p className="text-sm text-muted-foreground">Số lượng: {item.quantity}</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <div>
                                <p className="font-semibold">{item.price.toLocaleString('vi-VN')}₫ × {item.quantity}</p>
                                <p className="text-sm font-bold text-orange-600">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                              </div>
                              {canReviewOrder(order) && !productReview && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs"
                                  onClick={() => handleOpenReviewModal(order.id, item)}
                                >
                                  <Star className="h-3.5 w-3.5 mr-1" />
                                  Đánh giá
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {productReview && (
                        <div className="mt-3 rounded-lg border border-orange-100 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                              <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                              {productReview.rating}/5
                              <span className="text-xs font-normal text-orange-500">Đã đánh giá</span>
                            </div>
                            {canReviewOrder(order) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-orange-600 hover:text-orange-700"
                                onClick={() => handleOpenReviewModal(order.id, item, productReview)}
                              >
                                Chỉnh sửa
                              </Button>
                            )}
                          </div>
                          {productReview.comment && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{productReview.comment}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(productReview.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      )}
                      {itemHasReturnRecord ? (
                        <div className="mt-2 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-purple-600 hover:text-purple-700 border-purple-200 hover:bg-purple-50"
                            onClick={() => setReturnStatusModal({ open: true, orderItemId: item.id })}
                          >
                            Xem trạng thái đổi/trả
                          </Button>
                        </div>
                      ) : isReturnable(order) ? (
                        <div className="mt-2 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleOpenReturnModal(order.id, item)}
                          >
                            Trả hàng hoàn tiền
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Địa chỉ giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p className="font-semibold">{shippingAddressData.fullName}</p>
                <p>{shippingAddressData.phone}</p>
                <p className="text-muted-foreground">
                  {shippingAddressData.street}, {shippingAddressData.ward}
                </p>
                <p className="text-muted-foreground">
                  {shippingAddressData.district}, {shippingAddressData.city}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính:</span>
                <span>{order.OrderItem.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-3">
                <span className="font-semibold">Tổng cộng:</span>
                <span className="font-bold text-orange-600 text-lg">{order.total.toLocaleString('vi-VN')}₫</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              Liên hệ hỗ trợ
            </Button>
            <Button variant="outline" className="w-full">
              In đơn hàng
            </Button>
          </div>
        </div>
      </div>

      <CreateReturnModal
        open={returnModal.open}
        onOpenChange={(open) => setReturnModal(prev => ({ ...prev, open }))}
        orderId={returnModal.orderId!}
        orderItemId={returnModal.orderItemId!}
        productId={returnModal.productId}
        variantId={returnModal.variantId}
        productName={returnModal.productName}
        productImage={returnModal.productImage}
        quantity={returnModal.quantity}
        price={returnModal.price}
        onSuccess={() => {
          toast({
            title: "Thành công",
            description: "Yêu cầu trả hàng đã được gửi",
          })
          if (userId && order) {
            fetchOrderReturns(userId, order.id)
          }
          fetchOrder()
          setReturnModal(prev => ({ ...prev, open: false }))
        }}
      />

      {userId && (
        <ReturnStatusModal
          open={returnStatusModal.open}
          onOpenChange={(open) => setReturnStatusModal(prev => ({ ...prev, open }))}
          orderItemId={returnStatusModal.orderItemId}
          userId={userId}
          onConfirmExchange={() => {
            if (userId && order) {
              fetchOrderReturns(userId, order.id)
            }
            fetchOrder()
          }}
        />
      )}

      <ReviewModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal(prev => ({ ...prev, open: false }))}
        productId={reviewModal.productId || 0}
        productName={reviewModal.productName}
        orderId={reviewModal.orderId || 0}
        reviewId={reviewModal.reviewId}
        initialRating={reviewModal.initialRating}
        initialComment={reviewModal.initialComment}
        onReviewSubmitted={() => {
          fetchOrder()
          if (userId && order) {
            fetchOrderReviews(userId, order.id)
          }
        }}
      />
      <Dialog open={!!proofConfirmation} onOpenChange={(open) => !open && closeProofConfirmation()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Xác nhận gửi minh chứng</DialogTitle><DialogDescription>Hãy kiểm tra ảnh thuộc đúng đơn và hiển thị rõ số tiền, nội dung chuyển khoản cùng thời gian giao dịch.</DialogDescription></DialogHeader>
          {proofConfirmation && <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900"><p>Đơn hàng: <b className="font-mono">{order.orderNumber}</b></p><p className="mt-1">Số tiền: <b>{Number(order.total).toLocaleString('vi-VN')}₫</b></p></div>
            <Label htmlFor="order-proof-file" className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-blue-300 bg-white px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50"><Upload className="h-4 w-4" />{proofConfirmation.file ? 'Chọn ảnh khác' : 'Chọn ảnh minh chứng'}</Label>
            <Input id="order-proof-file" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void selectProofFile(event.target.files?.[0]); event.currentTarget.value = '' }} />
            {proofConfirmation.previewUrl ? <img src={proofConfirmation.previewUrl} alt="Xem trước minh chứng thanh toán" className="max-h-72 w-full rounded-lg border bg-white object-contain" /> : <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">Chưa chọn ảnh minh chứng.</p>}
            {paymentProofOcrEnabled && (proofOcr.checking ? <p className="text-sm font-medium text-blue-700">Đang kiểm tra ảnh…</p> : proofOcr.status ? <p className={`rounded-md p-3 text-sm ${proofOcr.status === 'verified' ? 'bg-emerald-50 text-emerald-800' : proofOcr.status === 'review' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'}`}>{proofOcr.reason}</p> : null)}
          </div>}
          <DialogFooter><Button variant="outline" onClick={closeProofConfirmation}>Hủy</Button><Button disabled={!proofConfirmation?.file || (paymentProofOcrEnabled && (proofOcr.checking || ['rejected', 'error', 'unavailable'].includes(proofOcr.status || '')))} onClick={() => void confirmPaymentProof()}>Xác nhận gửi minh chứng</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
