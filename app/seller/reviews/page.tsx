"use client"

import { Star, ThumbsUp, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SellerReviewsPage() {
  const reviews = [
    { id: 1, customer: "Nguyễn Văn A", product: "Điện thoại Samsung Galaxy A15", rating: 5, comment: "Sản phẩm rất tốt, giao hàng nhanh!", helpful: 12, date: "2025-01-15" },
    { id: 2, customer: "Trần Thị B", product: "Tai nghe Bluetooth", rating: 4, comment: "Chất lượng ổn, chỉ hơi hạn chế về pin", helpful: 8, date: "2025-01-14" },
    { id: 3, customer: "Phạm Văn C", product: "Áo thun cotton nam", rating: 3, comment: "Hàng ok nhưng kích cỡ hơi nhỏ", helpful: 5, date: "2025-01-13" },
  ]

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Đánh giá shop</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Điểm đánh giá</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">4.9/5.0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Tổng đánh giá</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">1,250</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Tích cực</p>
            <p className="text-3xl font-bold text-green-600 mt-2">95%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Trả lời</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">92%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="5star">5 sao</TabsTrigger>
          <TabsTrigger value="4star">4 sao</TabsTrigger>
          <TabsTrigger value="3star">3 sao</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Đánh giá từ khách hàng</CardTitle>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{review.customer}</p>
                      <p className="text-xs text-muted-foreground">{review.product}</p>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm mb-2">{review.comment}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{review.date}</span>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{review.helpful} người thấy hữu ích</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="5star">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Hiển thị các đánh giá 5 sao</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="4star">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Hiển thị các đánh giá 4 sao</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="3star">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Hiển thị các đánh giá 3 sao</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
