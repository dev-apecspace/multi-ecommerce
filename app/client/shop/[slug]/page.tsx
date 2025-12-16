"use client"

import { use, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Heart, MapPin, Shield, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ProductGrid } from "@/components/category/product-grid"
import { useLoading } from "@/hooks/use-loading"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/pagination"

interface ShopPageProps {
  params: Promise<{ slug: string }>
}

export default function ShopPage({ params }: ShopPageProps) {
  const resolvedParams = use(params)
  const { setIsLoading } = useLoading()
  const [shop, setShop] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const pagination = usePagination({ initialPage: 1, initialLimit: 20 })

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setIsLoading(true)
        const vendorResponse = await fetch(`/api/vendors?slug=${encodeURIComponent(resolvedParams.slug)}`)
        const vendorResult = await vendorResponse.json()
        const vendor = vendorResult.data?.[0]
        
        if (vendor) {
          setShop({
            id: vendor.id,
            name: vendor.name,
            verified: vendor.status === 'approved',
            verification_badge: vendor.verification_status || "Đã xác minh",
            avatar: vendor.avatar || vendor.logo || "/placeholder.svg?key=2rtyv",
            banner: vendor.coverImage || vendor.banner || "/placeholder.svg?key=ajdts",
            rating: vendor.rating || 0,
            reviews: vendor.reviews_count || 0,
            followers: vendor.followers_count || vendor.followers || 0,
            responded: vendor.response_rate || 90,
            response_time: vendor.response_time || "< 1 giờ",
            joined: vendor.created_at || new Date().toISOString(),
            location: vendor.city || "Việt Nam",
            description: vendor.description || "Cửa hàng của chúng tôi",

            stats: {
              positive: vendor.positive_rating || 95,
              neutral: vendor.neutral_rating || 3,
              negative: vendor.negative_rating || 2,
              products: vendor.products_count || 0,
              followers: vendor.followers_count || 0,
              transactions: vendor.total_transactions || 0,
            },

            policies: {
              shipping: vendor.shipping_policy || "Giao hàng toàn quốc",
              return: vendor.return_policy || "Trả hàng trong 30 ngày",
              warranty: vendor.warranty_policy || "Bảo hành theo quy định",
            },

            contact: {
              phone: vendor.phone || "N/A",
              email: vendor.email || "N/A",
              address: vendor.address || "N/A",
            },
          })

          const reviewsResponse = await fetch(`/api/reviews?vendorId=${vendor.id}&limit=100`)
          const reviewsResult = await reviewsResponse.json()
          setReviews(reviewsResult.data || [])
        }
      } catch (error) {
        console.error('Error fetching shop data:', error)
      } finally {
        setLoading(false)
        setIsLoading(false)
      }
    }

    fetchShopData()
  }, [resolvedParams.slug])

  useEffect(() => {
    const fetchProducts = async () => {
      if (!shop?.id) return
      
      try {
        const productsResponse = await fetch(`/api/products?vendorId=${shop.id}&limit=${pagination.limit}&offset=${pagination.offset}`)
        const productsResult = await productsResponse.json()
        setProducts(productsResult.data || [])
        pagination.setTotal(productsResult.pagination?.total || 0)
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }

    fetchProducts()
  }, [shop?.id, pagination.page, pagination.limit])


  if (loading) {
    return (
      <main className="min-h-screen bg-surface dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </main>
    )
  }

  if (!shop) {
    return (
      <main className="min-h-screen bg-surface dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Không tìm thấy cửa hàng</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      {/* Shop Banner */}
      <div className="relative h-40 md:h-64 bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <Image src={shop.banner || "/placeholder.svg"} alt={shop.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="container-viewport -mt-20 md:-mt-32 relative z-10 mb-8">
        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Shop Avatar */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border-4 border-white dark:border-slate-900 bg-gray-200">
                  <Image
                    src={shop.avatar || "/placeholder.svg"}
                    alt={shop.name}
                    width={160}
                    height={160}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>

              {/* Shop Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 mb-2">
                      {shop.name}
                      {shop.verified && <Shield className="h-6 w-6 text-green-500" />}
                    </h1>
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                      <Badge className="bg-green-100 text-green-600">{shop.verification_badge}</Badge>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-sm">
                  <div>
                    <p className="text-muted-foreground">Đánh giá</p>
                    <p className="font-bold flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {shop.rating} ({shop.reviews.toLocaleString("vi-VN")})
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Người theo dõi</p>
                    <p className="font-bold">{(shop.followers / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phản hồi</p>
                    <p className="font-bold">{shop.responded}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Thời gian phản hồi</p>
                    <p className="font-bold">{shop.response_time}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button>Theo dõi</Button>
                  <Button variant="outline">Trò chuyện</Button>
                  <Button variant="outline" size="icon">
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container-viewport">
        {/* Tabs */}
        <Tabs defaultValue="products" className="mb-12">
          <TabsList className="flex gap-2 overflow-x-auto w-full justify-start">
            <TabsTrigger value="products">Sản phẩm ({products.length})</TabsTrigger>
            <TabsTrigger value="about">Về shop</TabsTrigger>
            <TabsTrigger value="policies">Chính sách</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá ({reviews.length})</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {products.map((product: any) => (
                    <Link key={product.id} href={`/client/product/${product.slug}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardContent className="p-3">
                          <div className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden mb-2">
                            <Image
                              src={product.media[0].url || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
                          <p className="text-primary font-bold mb-2">{product.price.toLocaleString('vi-VN')} ₫</p>
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{product.rating || 0}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                <div className="mt-8">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={pagination.goToPage}
                    limit={pagination.limit}
                    onLimitChange={pagination.setPageLimit}
                    total={pagination.total}
                  />
                </div>
              </>
            ) : (
              <Card className="p-6">
                <CardContent className="p-0 text-center py-12">
                  <p className="text-muted-foreground">Cửa hàng chưa có sản phẩm</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card className="p-6">
                  <CardContent className="p-0 space-y-6">
                    <section>
                      <h3 className="text-lg font-bold mb-3">Giới thiệu</h3>
                      <p className="text-muted-foreground leading-relaxed">{shop.description}</p>
                    </section>

                    <section className="border-t border-border pt-6">
                      <h3 className="text-lg font-bold mb-3">Thống kê</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-surface dark:bg-slate-800 rounded-lg">
                          <p className="text-sm text-muted-foreground">Sản phẩm</p>
                          <p className="text-2xl font-bold text-primary">{shop.stats.products}</p>
                        </div>
                        <div className="p-3 bg-surface dark:bg-slate-800 rounded-lg">
                          <p className="text-sm text-muted-foreground">Giao dịch</p>
                          <p className="text-2xl font-bold text-primary">
                            {shop.stats.transactions.toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="border-t border-border pt-6">
                      <h3 className="text-lg font-bold mb-3">Đánh giá người bán</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600">Tích cực</span>
                          <div className="flex-1 mx-4 bg-surface dark:bg-slate-800 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${shop.stats.positive}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-semibold">{shop.stats.positive}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Trung bình</span>
                          <div className="flex-1 mx-4 bg-surface dark:bg-slate-800 rounded-full h-2">
                            <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${shop.stats.neutral}%` }} />
                          </div>
                          <span className="w-12 text-right font-semibold">{shop.stats.neutral}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-600">Tiêu cực</span>
                          <div className="flex-1 mx-4 bg-surface dark:bg-slate-800 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${shop.stats.negative}%` }} />
                          </div>
                          <span className="w-12 text-right font-semibold">{shop.stats.negative}%</span>
                        </div>
                      </div>
                    </section>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Card */}
              <div>
                <Card className="sticky top-20">
                  <CardContent className="p-6 space-y-6">
                    <section>
                      <h3 className="font-bold mb-3">Liên hệ</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-muted-foreground">Điện thoại</p>
                            <p className="font-semibold">{shop.contact.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Mail className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-semibold">{shop.contact.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-muted-foreground">Địa chỉ</p>
                            <p className="font-semibold text-xs">{shop.contact.address}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="border-t border-border pt-6">
                      <h3 className="font-bold mb-2">Thành viên từ</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(shop.joined).toLocaleDateString("vi-VN")}
                      </p>
                    </section>

                    <Button className="w-full">Trò chuyện với shop</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="mt-6">
            <Card className="p-6">
              <CardContent className="p-0 space-y-6">
                {Object.entries(shop.policies).map(([key, value]) => (
                  <div key={key} className="pb-6 border-b border-border last:border-b-0">
                    <h3 className="font-bold mb-2 capitalize">
                      {key === "shipping" ? "Vận chuyển" : key === "return" ? "Hoàn trả" : "Bảo hành"}
                    </h3>
                    <p className="text-muted-foreground">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                            {review.User?.name?.charAt(0) || "U"}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{review.User?.name || "Người dùng"}</h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          {review.Product && (
                            <Link href={`/client/product/${review.Product.id}`} className="text-xs text-muted-foreground hover:text-primary mb-2 block">
                              Sản phẩm: {review.Product.name}
                            </Link>
                          )}
                          <p className="text-sm">{review.comment}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <CardContent className="p-0 text-center py-12">
                  <p className="text-muted-foreground">Chưa có đánh giá nào</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
