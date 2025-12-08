"use client"

import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPromotionsPage() {
  const promotions = [
    { id: 1, name: "Flash Sale - Hôm nay", discount: "50%", start: "2025-01-15", end: "2025-01-15", status: "Active" },
    { id: 2, name: "Mua 2 giảm 1", discount: "30%", start: "2025-01-10", end: "2025-01-20", status: "Active" },
    { id: 3, name: "Khuyến mãi đầu năm", discount: "25%", start: "2025-01-01", end: "2025-01-31", status: "Ended" },
  ]

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Quản lý khuyến mãi & Flash Sale</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Thêm khuyến mãi
        </Button>
      </div>

      <Tabs defaultValue="promotions">
        <TabsList>
          <TabsTrigger value="promotions">Khuyến mãi</TabsTrigger>
          <TabsTrigger value="flashsale">Flash Sale</TabsTrigger>
        </TabsList>

        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách khuyến mãi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Tên khuyến mãi</th>
                      <th className="text-left py-3 px-4">Giảm giá</th>
                      <th className="text-left py-3 px-4">Từ ngày</th>
                      <th className="text-left py-3 px-4">Đến ngày</th>
                      <th className="text-left py-3 px-4">Trạng thái</th>
                      <th className="text-left py-3 px-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.map((promo) => (
                      <tr key={promo.id} className="border-b border-border hover:bg-muted">
                        <td className="py-3 px-4">{promo.id}</td>
                        <td className="py-3 px-4">{promo.name}</td>
                        <td className="py-3 px-4 font-semibold">{promo.discount}</td>
                        <td className="py-3 px-4">{promo.start}</td>
                        <td className="py-3 px-4">{promo.end}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            promo.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {promo.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          <Edit className="h-4 w-4 cursor-pointer text-orange-600" />
                          <Trash2 className="h-4 w-4 cursor-pointer text-red-600" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flashsale">
          <Card>
            <CardHeader>
              <CardTitle>Flash Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Quản lý các chương trình Flash Sale</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
