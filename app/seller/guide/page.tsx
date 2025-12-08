"use client"

import { BookOpen, CheckCircle, Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SellerGuidePage() {
  return (
    <main className="container-viewport py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Hướng dẫn bán hàng</h1>
        <p className="text-muted-foreground">Tất cả những gì bạn cần biết để bán thành công trên Sàn TMĐT</p>
      </div>

      <Tabs defaultValue="getting-started">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="getting-started">Bắt đầu</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
          <TabsTrigger value="tips">Mẹo</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="space-y-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Bắt đầu bán hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Hoàn thành hồ sơ shop</h4>
                <p className="text-sm text-muted-foreground">Cập nhật logo, mô tả shop, và thông tin liên hệ để tăng độ tin tưởng với khách hàng.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Thêm sản phẩm</h4>
                <p className="text-sm text-muted-foreground">Tải lên ảnh chất lượng cao, viết mô tả chi tiết, và đặt giá cạnh tranh.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Quản lý sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Quy tắc tải sản phẩm</h4>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>Hình ảnh phải rõ ràng, không mờ hoặc bị cắt</li>
                  <li>Tải ít nhất 3 hình ảnh, tối đa 10 hình</li>
                  <li>Mô tả phải chi tiết và trung thực</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Xử lý đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Hãy phản hồi nhanh các câu hỏi từ khách hàng</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Mẹo bán hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Tham gia Flash Sale và đưa ra khuyến mãi hấp dẫn</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}