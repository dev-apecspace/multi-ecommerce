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
import { VariantSelectionModal } from "@/components/product/variant-selection-modal"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const resolvedParams = use(params)
  const productSlug = resolvedParams.slug
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [action, setAction] = useState<'buy' | 'cart' | null>(null)
  const { data: reviewsData, loading: reviewsLoading, fetchReviews } = useReviews(product?.id)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products?slug=${encodeURIComponent(productSlug)}&limit=1&offset=0`)
        const result = await response.json()
        console.log('Fetched product result:', result)
        const prod = result.data?.[0]
        console.log('Product data:', prod)
        if (prod) {
          // Compute display pricing from variants (prefer salePrice if available)
          const variantPrices = (prod.ProductVariant || []).map((v: any) => ({
            sale: v.salePrice ?? v.price,
            base: v.originalPrice ?? v.price,
          }))
          const minVariantSale = variantPrices.length ? Math.min(...variantPrices.map((p) => p.sale)) : null
          const minVariantBase = variantPrices.length ? Math.min(...variantPrices.map((p) => p.base)) : null

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
          // Set product-level price/salePrice: always prefer min variant sale if available
          const basePrice = prod.originalPrice ?? minVariantBase ?? prod.price
          const salePriceFromVariants = minVariantSale !== null ? minVariantSale : null

          productData.originalPrice = basePrice ?? prod.price
          productData.salePrice = prod.salePrice ?? salePriceFromVariants ?? null
          productData.price = productData.salePrice ?? basePrice ?? prod.price

          console.log('Setting product with variants:', productData.variants)
          setProduct(productData)
          if (prod.id) {
            fetchReviews()
          }
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
      }
    }

    if (productSlug) {
      fetchProduct()
    }
  }, [productSlug, fetchReviews])

  const reviews = Array.isArray(reviewsData?.data) ? reviewsData.data : []

  const handleBuyNow = () => {
    if (product?.variants && product.variants.length > 0) {
      setAction('buy')
      setVariantModalOpen(true)
    } else {
      const checkoutItems = [{
        id: product?.id,
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        price: product.price,
        image: product.image,
        vendorId: product.vendorId,
        vendorName: product.seller.name
      }]
      sessionStorage.setItem('checkoutItems', JSON.stringify(checkoutItems))
      router.push('/client/checkout')
    }
  }

  const handleAddToCart = async () => {
    console.log('handleAddToCart clicked, product:', product)
    console.log('product.variants:', product?.variants)
    if (product?.variants && product.variants.length > 0) {
      console.log('Has variants, opening modal')
      setAction('cart')
      setVariantModalOpen(true)
    } else {
      console.log('No variants, adding to cart directly')
      setIsAddingToCart(true)
      
      if (!user) {
        console.log('User not logged in')
        toast({
          title: 'Lỗi',
          description: 'Vui lòng đăng nhập trước',
          variant: 'destructive'
        })
        setIsAddingToCart(false)
        return
      }

      const userId = user.id
      console.log('userId from auth context:', userId)
      
      try {
        const payload = {
          userId: typeof userId === 'string' ? parseInt(userId) : userId,
          productId: product.id,
          quantity: quantity,
          variantId: null
        }
        console.log('Sending to /api/cart:', payload)
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        console.log('Response status:', response.status)
        if (response.ok) {
          console.log('Cart updated successfully')
          addToCart(quantity)
          toast({
            title: 'Thành công',
            description: 'Đã thêm sản phẩm vào giỏ hàng'
          })
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('API error:', errorData)
          toast({
            title: 'Lỗi',
            description: errorData.error || 'Không thể thêm vào giỏ hàng',
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('Add to cart error:', error)
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

  const handleVariantConfirm = async (variantId: number, qty: number) => {
    try {
      setIsAddingToCart(true)

      if (!user) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng đăng nhập trước',
          variant: 'destructive'
        })
        return
      }

      const userId = user.id

      if (action === 'buy') {
        const checkoutItems = [{
          id: variantId,
          productId: product.id,
          productName: product.name,
          quantity: qty,
          price: product.price,
          image: product.image,
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

  const effectivePrice = product.salePrice ?? product.price
  const effectiveOriginal = product.originalPrice || product.price
  const discount =
    effectiveOriginal && effectiveOriginal > effectivePrice
      ? Math.round(((effectiveOriginal - effectivePrice) / effectiveOriginal) * 100)
      : 0

  const displayProduct = {
    id: product.id,
    name: product.name || "Sản phẩm",
    price: effectivePrice || 0,
    originalPrice: effectiveOriginal || effectivePrice,
    rating: product.rating || 4.8,
    reviews: product.reviews || 0,
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
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    -{discount}%
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto">
                  {displayProduct.images.map((img, idx) => (
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
                <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-primary">{displayProduct.price.toLocaleString("vi-VN")}₫</span>
                    {displayProduct.originalPrice > displayProduct.price && (
                      <>
                        <span className="text-lg text-muted-foreground line-through">
                          {displayProduct.originalPrice.toLocaleString("vi-VN")}₫
                        </span>
                        <span className="text-sm font-semibold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">
                          -{discount}%
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
                      onClick={() => setIsFavorite(!isFavorite)}
                    >
                      <Heart className={`h-6 w-6 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent h-10" onClick={handleAddToCart} disabled={isAddingToCart}>
                    {isAddingToCart ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}
                  </Button>

                  <Button variant="outline" className="w-full bg-transparent">
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
                  <Button>Theo dõi Shop</Button>
                </div>
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button variant="outline" className="flex-1 bg-transparent" size="sm">
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
                      {Object.entries(displayProduct.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-3 border-b border-border last:border-b-0">
                          <span className="font-medium text-muted-foreground">{key}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-4">
                {reviewsLoading ? (
                  <p className="text-center py-6">Đang tải đánh giá...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">Chưa có đánh giá nào</p>
                ) : (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <Card key={review.id} className="p-4">
                      <CardContent className="p-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{review.author}</p>
                            <p className="text-xs text-muted-foreground">{review.date}</p>
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
                        <p className="font-medium mb-1">{review.title}</p>
                        <p className="text-sm text-muted-foreground">{review.content}</p>
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
            productImage={product.image || "/placeholder.svg"}
            price={effectivePrice}
            originalPrice={product.originalPrice || product.price}
            salePrice={product.salePrice}
            variants={(product.variants || []).map((v: any) => ({
              ...v,
              salePrice: v.salePrice ?? v.price,
            }))}
            attributes={product.ProductAttribute || []}
            onConfirm={handleVariantConfirm}
            isLoading={isAddingToCart}
          />
        )}
      </div>
    </main>
  )
}
