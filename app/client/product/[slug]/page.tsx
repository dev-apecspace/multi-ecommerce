"use client"

import { useState, use, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Heart, MessageCircle, Truck, Award, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useReviews } from "@/hooks/useSupabase"
import { useToast } from "@/hooks/use-toast"
import { useLoading } from "@/hooks/use-loading"
import { VariantSelectionModal } from "@/components/product/variant-selection-modal"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useFavoritesContext } from "@/lib/favorites-context"
import { computePrice, isCampaignActive } from "@/lib/price-utils"

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { setIsLoading } = useLoading()
  const { updateFavoritesCount } = useFavoritesContext()
  const resolvedParams = use(params)
  const productSlug = resolvedParams.slug
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isFollowingShop, setIsFollowingShop] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [action, setAction] = useState<'buy' | 'cart' | null>(null)
  const { data: reviewsData, loading: reviewsLoading, fetchReviews } = useReviews(product?.id)

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      setIsLoading(true)
      try {
        const response = await fetch(`/api/products?slug=${encodeURIComponent(productSlug)}&limit=1&offset=0`)
        const result = await response.json()
        const prod = result.data?.[0]
        if (prod) {
          const variantPrices: Array<{ campaignPrice: number | null; basePrice: number; originalPrice: number | undefined }> = (prod.ProductVariant || []).map((v: any) => ({
            campaignPrice: v.salePrice ?? null,
            basePrice: v.price ?? prod.price,
            originalPrice: v.originalPrice ?? prod.originalPrice,
          }))

          const productData = {
            ...prod,
            images: prod.media?.map((img: any) => img.url) || [prod.image || "/placeholder.svg"],
            specifications: {
              "Thương hiệu": prod.Category?.name || "N/A",
              "Danh mục": prod.SubCategory?.name || "N/A",
              "Giá gốc": prod.originalPrice?.toLocaleString("vi-VN") + "₫" || "N/A",
            },
            seller: {
              name: prod.Vendor?.name || "Shop",
              vendorId: prod.vendorId,
              vendorSlug: prod.Vendor?.slug || '',
              avatar: prod.Vendor?.logo || prod.Vendor?.avatar || null,
              rating: prod.Vendor?.rating || 0,
              followers: prod.Vendor?.followers_count || prod.Vendor?.followers || 0,
              verified: prod.Vendor?.status === 'approved',
              verified_badge: prod.Vendor?.status === 'approved' ? "Xác thực" : "Chưa xác thực",
              responseTime: "Trả lời trong 1 giờ",
            },
            variants: prod.ProductVariant || [],
          }

          // Use first variant price if available, otherwise fallback to product price
          let campaignPrice = prod.salePrice
          let basePrice = prod.price
          let originalPrice = prod.originalPrice

          if (prod.ProductVariant && prod.ProductVariant.length > 0) {
            const firstVar = prod.ProductVariant[0]
            campaignPrice = firstVar.salePrice ?? null
            basePrice = firstVar.price
            originalPrice = firstVar.originalPrice ?? firstVar.price
          }

          productData.salePrice = campaignPrice ?? null
          productData.campaignPrice = campaignPrice ?? null
          productData.price = basePrice ?? originalPrice
          productData.originalPrice = originalPrice ?? basePrice
          productData.parentPrice = prod.price
          productData.parentOriginalPrice = prod.originalPrice
          productData.taxApplied = prod.taxApplied || false
          productData.taxIncluded = prod.taxIncluded !== false
          productData.taxRate = prod.taxRate || 0

          setProduct(productData)
          if (prod.id) {
            fetchReviews()
          }
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
        setIsLoading(false)
      }
    }

    if (productSlug) {
      fetchProduct()
    }
  }, [productSlug, fetchReviews])

  useEffect(() => {
    const checkIfFavorited = async () => {
      if (!user || !product) return
      
      try {
        const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
        const response = await fetch(`/api/favorites?userId=${userId}`)
        if (response.ok) {
          const favorites = await response.json()
          const isFavorited = favorites.some((fav: any) => fav.productId === product.id)
          setIsFavorite(isFavorited)
        }
      } catch (error) {
        console.error('Error checking favorite status:', error)
      }
    }

    checkIfFavorited()
  }, [user, product])

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !product?.vendorId) return

      try {
        const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
        const response = await fetch(`/api/shop-follows?userId=${userId}&vendorId=${product.vendorId}`)
        if (response.ok) {
          const data = await response.json()
          setIsFollowingShop(data.isFollowing)
        }
      } catch (error) {
        console.error('Error checking follow status:', error)
      }
    }

    checkFollowStatus()
  }, [user, product?.vendorId])

  const reviews = Array.isArray(reviewsData?.data) ? reviewsData.data : []
  const reviewCount = reviews.length > 0 ? reviews.length : Number(product?.reviews) || 0
  const averageRating =
    reviews.length > 0
      ? Number(
          (
            reviews.reduce((sum: number, review: any) => sum + (Number(review.rating) || 0), 0) /
            reviews.length
          ).toFixed(1)
        )
      : Number(product?.rating) || 0
  const formattedReviews = reviews.map((review: any) => ({
    id: review.id,
    author: review.User?.name || 'Khách hàng ẩn danh',
    date: review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : '',
    rating: Number(review.rating) || 0,
    comment: review.comment || '',
  }))

  const isPromotionActive = () => {
    return isCampaignActive(product?.appliedCampaign)
  }

  const getFlashSaleTimeDisplay = () => {
    if (!product?.appliedCampaign?.flashSaleStartTime || !product?.appliedCampaign?.flashSaleEndTime) {
      return null
    }
    return `${product.appliedCampaign.flashSaleStartTime} - ${product.appliedCampaign.flashSaleEndTime}`
  }

  const handleChatWithSeller = async () => {
    if (!user) {
      router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
      return
    }

    if (!product?.vendorId) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/client/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: product.vendorId })
      })
      const data = await res.json()
      
      if (data.conversation) {
        router.push(`/client/chat?conversationId=${data.conversation.id}`)
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể bắt đầu trò chuyện',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyNow = () => {
    if (!user) {
      router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
      return
    }

    if (product?.variants && product.variants.length > 0) {
      setAction('buy')
      setVariantModalOpen(true)
    } else {
      const effectivePrice = (promotionActive ? (product.campaignPrice ?? product.salePrice ?? product.price) : product.price)
      const checkoutItems = [{
        id: product?.id,
        productId: product.id,
        variantId: null,
        productName: product.name,
        quantity: quantity,
        price: effectivePrice,
        basePrice: product.price,
        originalPrice: product.originalPrice,
        salePrice: promotionActive ? product.salePrice : null,
        taxApplied: product.taxApplied,
        taxRate: product.taxRate,
        image: product.image,
        vendorId: product.vendorId,
        vendorName: product.seller.name
      }]
      sessionStorage.setItem('checkoutItems', JSON.stringify(checkoutItems))
      router.push('/client/checkout')
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
      return
    }

    if (product?.variants && product.variants.length > 0) {
      setAction('cart')
      setVariantModalOpen(true)
    } else {
      setIsAddingToCart(true)

      const userId = user.id

      try {
        const payload = {
          userId: typeof userId === 'string' ? parseInt(userId) : userId,
          productId: product.id,
          quantity: quantity,
          variantId: null
        }
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          addToCart(quantity)
          toast({
            title: 'Thành công',
            description: 'Đã thêm sản phẩm vào giỏ hàng'
          })
        } else {
          const errorData = await response.json().catch(() => ({}))
          toast({
            title: 'Lỗi',
            description: errorData.error || 'Không thể thêm vào giỏ hàng',
            variant: 'destructive'
          })
        }
      } catch (error) {
        toast({
          title: 'Lỗi',
          description: 'Đã xảy ra lỗi',
          variant: 'destructive'
        })
      } finally {
        setIsAddingToCart(false)
      }
    }
  }

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
      return
    }

    try {
      setIsLoading(true)
      const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id

      if (isFavorite) {
        const response = await fetch(`/api/favorites?userId=${userId}&productId=${product.id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setIsFavorite(false)
          toast({
            title: 'Thành công',
            description: 'Đã xóa khỏi danh sách yêu thích'
          })
          updateFavoritesCount()
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, productId: product.id })
        })
        if (response.ok) {
          setIsFavorite(true)
          toast({
            title: 'Thành công',
            description: 'Đã thêm vào danh sách yêu thích'
          })
          updateFavoritesCount()
        }
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể thay đổi danh sách yêu thích',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollowShop = async () => {
    if (!user) {
      router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
      return
    }

    if (!product?.vendorId) return

    try {
      const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
      
      if (isFollowingShop) {
        const response = await fetch(`/api/shop-follows?userId=${userId}&vendorId=${product.vendorId}`, {
          method: 'DELETE',
        })
        
        if (response.ok) {
          setIsFollowingShop(false)
          setProduct((prev: any) => ({
            ...prev,
            seller: {
              ...prev.seller,
              followers: Math.max(0, prev.seller.followers - 1)
            }
          }))
          toast({
            title: 'Thành công',
            description: 'Đã hủy theo dõi cửa hàng'
          })
        }
      } else {
        const response = await fetch('/api/shop-follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, vendorId: product.vendorId })
        })

        if (response.ok) {
          setIsFollowingShop(true)
          setProduct((prev: any) => ({
            ...prev,
            seller: {
              ...prev.seller,
              followers: prev.seller.followers + 1
            }
          }))
          toast({
            title: 'Thành công',
            description: 'Đã theo dõi cửa hàng'
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể thay đổi trạng thái theo dõi',
        variant: 'destructive'
      })
    }
  }

  const handleVariantConfirm = async (variantId: number, qty: number) => {
    if (!user) {
      router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
      return
    }

    try {
      setIsAddingToCart(true)

      const userId = user.id

      if (action === 'buy') {
        const selectedVariant = product.variants.find((v: any) => v.id === variantId)
        const variantPromotionActive = isCampaignActive(selectedVariant?.appliedCampaign)
        const variantCampaignPrice = (variantPromotionActive ? selectedVariant?.salePrice : null) ?? null
        const variantBasePrice = selectedVariant?.price ?? product.price
        const variantOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice

        const checkoutItems = [{
          id: variantId,
          productId: product.id,
          variantId: variantId,
          variantName: selectedVariant?.name,
          productName: product.name,
          quantity: qty,
          price: variantCampaignPrice ?? variantBasePrice,
          basePrice: variantBasePrice,
          originalPrice: variantOriginalPrice,
          salePrice: variantCampaignPrice,
          taxApplied: product.taxApplied,
          taxRate: product.taxRate,
          image: selectedVariant?.image || product.image,
          vendorId: product.vendorId,
          vendorName: product.seller.name
        }]
        sessionStorage.setItem('checkoutItems', JSON.stringify(checkoutItems))
        router.push('/client/checkout')
      } else {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: typeof userId === 'string' ? parseInt(userId) : userId,
            productId: product.id,
            quantity: qty,
            variantId: variantId && variantId !== product.id ? variantId : null
          })
        })

        if (response.ok) {
          addToCart(qty)
          toast({
            title: 'Thành công',
            description: 'Đã thêm sản phẩm vào giỏ hàng'
          })
          setVariantModalOpen(false)
        } else {
          toast({
            title: 'Lỗi',
            description: 'Không thể thêm vào giỏ hàng',
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi',
        variant: 'destructive'
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  if (loading || !product) {
    return (
      <main className="min-h-screen bg-surface dark:bg-slate-950 flex items-center justify-center">
        <p className="text-muted-foreground">Đang tải sản phẩm...</p>
      </main>
    )
  }

  // derive canonical prices and display via computePrice
  const basePrice = (typeof product.price === 'number' && product.price > 0) 
    ? product.price 
    : (typeof product.originalPrice === 'number' && product.originalPrice > 0 ? product.originalPrice : 0)
  
  const promotionActive = isCampaignActive(product?.appliedCampaign)
  const salePrice = (promotionActive && typeof product.salePrice === 'number' && product.salePrice > 0) 
    ? product.salePrice 
    : (promotionActive && typeof product.campaignPrice === 'number' && product.campaignPrice > 0 ? product.campaignPrice : null)
  
  const originalPrice = (typeof product.originalPrice === 'number' && product.originalPrice > 0) ? product.originalPrice : basePrice

  const priceData = computePrice({
    basePrice,
    originalPrice,
    salePrice,
    taxApplied: product.taxApplied || false,
    taxRate: product.taxRate || 0,
    taxIncluded: product.taxIncluded !== false,
  })

  // prepare variants list enriched with display prices for modal
  const variantListForModal = (product.variants || []).map((v: any) => {
    const variantBase = v.price ?? product.parentPrice ?? product.price
    const variantPromotionActive = isCampaignActive(v.appliedCampaign)
    const variantSale = (variantPromotionActive && v.salePrice) ? v.salePrice : null
    const variantOriginal = v.originalPrice ?? product.parentOriginalPrice ?? product.originalPrice ?? variantBase

    const vd = computePrice({
      basePrice: variantBase,
      originalPrice: variantOriginal,
      salePrice: variantSale,
      taxApplied: !!product.taxApplied,
      taxRate: product.taxRate ?? 0,
      taxIncluded: product.taxIncluded !== false,
    })

    return {
      ...v,
      displayPrice: vd.displayPrice,
      displayOriginalPrice: vd.displayOriginalPrice,
      discountPercent: vd.discountPercent,
    }
  })

  const displayProduct = {
    id: product.id,
    name: product.name || "Sản phẩm",
    price: Math.max(0, priceData.displayPrice),
    originalPrice: Math.max(0, priceData.displayOriginalPrice),
    taxApplied: product.taxApplied || false,
    taxIncluded: product.taxIncluded || true,
    taxRate: product.taxRate || 0,
    rating: averageRating || 4.8,
    reviews: reviewCount || 0,
    sold: product.sold || 0,
    images: product.images || ["/placeholder.svg"],
    description: product.description || `${product.name}`,
    specifications: product.specifications || {
      "Thương hiệu": product.Category?.name || "N/A",
      "Danh mục": product.SubCategory?.name || "N/A",
    },
    shipping: {
      express: "Giao nhanh 2-3 giờ (Hà Nội, TP.HCM)",
      standard: "Giao tiêu chuẩn 1-3 ngày",
      freeShip: "Miễn phí vận chuyển từ 0đ",
    },
    seller: product.seller || {
      name: product.Vendor?.name || "Shop",
      vendorId: product.vendorId,
      vendorSlug: product.Vendor?.slug || '',
      rating: 4.9,
      followers: 125000,
      verified: true,
      verified_badge: "Xác thực",
      responseTime: "Trả lời trong 1 giờ",
    },
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <div className="container-viewport py-6">
        {/* Breadcrumb */}
        <nav className="flex gap-2 mb-6 text-xs">
          <Link href="/" className="text-muted-foreground hover:text-primary">
            Trang chủ
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/client/category/dien-tu" className="text-muted-foreground hover:text-primary">
            Điện tử
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground truncate">{displayProduct.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Images */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 p-4">
              <CardContent className="p-0 space-y-3">
                <div className="relative h-96 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <Image
                    src={displayProduct.images[selectedImage] || "/placeholder.svg"}
                    alt={displayProduct.name}
                    fill
                    className="object-cover"
                  />
                  {product.appliedCampaign?.campaignType === 'flash_sale' && (
                    <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold z-10">
                      <div className="flex items-center gap-1">
                        <span className="animate-pulse">⚡</span> FLASH SALE
                      </div>
                      {getFlashSaleTimeDisplay() && (
                        <div className="text-xs font-semibold mt-1">
                          {getFlashSaleTimeDisplay()}
                        </div>
                      )}
                    </div>
                  )}
                  {priceData.discountPercent > 0 && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      -{priceData.discountPercent}%
                    </div>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto">
                  {displayProduct.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? "border-primary" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`Hình ${idx + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle: Product Details */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <CardContent className="p-0 space-y-4">
                {/* Title & Rating */}
                <div>
                  <h1 className="text-2xl font-bold mb-3">{displayProduct.name}</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(displayProduct.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">
                      {displayProduct.rating} ({displayProduct.reviews.toLocaleString("vi-VN")} đánh giá)
                    </span>
                    <span className="text-sm text-muted-foreground">· Đã bán {(displayProduct.sold / 1000).toFixed(1)}k</span>
                  </div>
                </div>

                {/* Price */}
                <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 relative overflow-hidden">
                  {product.appliedCampaign?.campaignType === 'flash_sale' && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-2 rounded-bl-lg text-xs font-bold">
                      <div className="flex items-center gap-1">
                        <span className="animate-pulse">⚡</span> FLASH SALE
                      </div>
                      {getFlashSaleTimeDisplay() && (
                        <div className="text-xs font-semibold mt-1 whitespace-nowrap">
                          {getFlashSaleTimeDisplay()}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-primary">{displayProduct.price.toLocaleString("vi-VN")}₫</span>
                    {displayProduct.taxApplied && displayProduct.taxRate && product.taxIncluded && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        (đã bao gồm thuế)
                      </span>
                    )}
                    {priceData.discountPercent > 0 && (
                      <>
                        <span className="text-lg text-muted-foreground line-through">
                          {displayProduct.originalPrice.toLocaleString("vi-VN")}₫
                        </span>
                        <span className="text-sm font-semibold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">
                          -{priceData.discountPercent}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Promotions */}
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Ưu đãi khác:</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>✓ Miễn phí vận chuyển</p>
                    <p>✓ Trả góp 0% lên đến 12 tháng</p>
                    <p>✓ Hoàn tiền nếu sản phẩm lỗi</p>
                  </div>
                </div>

                {/* Shipping */}
                <div className="border-t border-b border-border py-3 space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <Truck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Giao hàng</p>
                      <p className="text-muted-foreground">{displayProduct.shipping.express}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Bảo hành</p>
                      <p className="text-muted-foreground">Bảo hành chính hãng 2 năm</p>
                    </div>
                  </div>
                </div>

                {/* Quantity & Actions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Số lượng:</span>
                    <div className="flex items-center border border-border rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-2 hover:bg-surface transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                        className="w-12 text-center border-l border-r border-border py-2 bg-transparent"
                        min="1"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-2 hover:bg-surface transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 h-12 text-base" onClick={handleBuyNow}>
                      Mua ngay
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 bg-transparent"
                      onClick={handleToggleFavorite}
                    >
                      <Heart className={`h-6 w-6 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent h-10" onClick={handleAddToCart} disabled={isAddingToCart}>
                    {isAddingToCart ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}
                  </Button>

                  <Button variant="outline" className="w-full bg-transparent" onClick={handleChatWithSeller}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Hỏi shop
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Seller Card */}
            <Card className="p-6">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {displayProduct.seller.avatar ? (
                      <img 
                        src={displayProduct.seller.avatar} 
                        alt={displayProduct.seller.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-2xl font-bold">
                        {displayProduct.seller.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold flex items-center gap-2">
                        {displayProduct.seller.name}
                        {displayProduct.seller.verified && <ShieldCheck className="h-4 w-4 text-green-500" />}
                      </p>
                      <p className="text-xs text-muted-foreground">{displayProduct.seller.verified_badge}</p>
                      <p className="text-xs flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {displayProduct.seller.rating} ({displayProduct.seller.followers.toLocaleString("vi-VN")} người theo dõi)
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleFollowShop} 
                    variant={isFollowingShop ? "outline" : "default"}
                  >
                    {isFollowingShop ? "Đang theo dõi" : "Theo dõi Shop"}
                  </Button>
                </div>
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button variant="outline" className="flex-1 bg-transparent" size="sm" onClick={handleChatWithSeller}>
                    Trò chuyện
                  </Button>
                  <Link href={`/client/shop/${displayProduct.seller.vendorSlug || displayProduct.seller.vendorId}`} className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent" size="sm">
                      Ghé shop
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Specifications & Reviews */}
            <Tabs defaultValue="specs" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>
                <TabsTrigger value="reviews">Đánh giá ({displayProduct.reviews})</TabsTrigger>
              </TabsList>

              <TabsContent value="specs" className="mt-4">
                <Card className="p-6">
                  <CardContent className="p-0">
                    <div className="space-y-3">
                      {Object.entries(displayProduct.specifications).map(([key, value]: [string, unknown]) => (
                        <div key={key} className="flex justify-between py-3 border-b border-border last:border-b-0">
                          <span className="font-medium text-muted-foreground">{key}</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-4">
                {reviewsLoading ? (
                  <p className="text-center py-6">Đang tải đánh giá...</p>
                ) : formattedReviews.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">Chưa có đánh giá nào</p>
                ) : (
                  <div className="space-y-4">
                    {formattedReviews.map((review) => (
                      <Card key={review.id} className="p-4">
                        <CardContent className="p-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{review.author}</p>
                              <p className="text-xs text-muted-foreground">{review.date || 'Vừa cập nhật'}</p>
                            </div>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {review.comment || 'Không có nội dung'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Variant Selection Modal */}
        {product && (
          <VariantSelectionModal
            open={variantModalOpen}
            onOpenChange={setVariantModalOpen}
            productId={product.id}
            productName={product.name}
            productImage={product.media && Array.isArray(product.media) ? product.media : (product.image || "/placeholder.svg")}
            price={basePrice}
            salePrice={product.campaignPrice}
            originalPrice={originalPrice}
            variants={variantListForModal}
            attributes={product.ProductAttribute || []}
            onConfirm={handleVariantConfirm}
            isLoading={isAddingToCart}
            taxApplied={product.taxApplied}
            taxRate={product.taxRate}
            taxIncluded={product.taxIncluded}
          />
        )}
      </div>
    </main>
  )
}
