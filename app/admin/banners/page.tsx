"use client"

import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminBannersPage() {
  const banners = [
    { id: 1, name: "Banner Tết Nguyên Đán", image: "/placeholder.svg", position: "Homepage", status: "Active" },
    { id: 2, name: "Banner Flash Sale", image: "/placeholder.svg", position: "Homepage", status: "Active" },
    { id: 3, name: "Banner Khuyến mãi", image: "/placeholder.svg", position: "Category", status: "Inactive" },
  ]

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Banner & Quảng cáo</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Thêm banner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách banner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Tên banner</th>
                  <th className="text-left py-3 px-4">Vị trí</th>
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-left py-3 px-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner.id} className="border-b border-border hover:bg-muted">
                    <td className="py-3 px-4">{banner.id}</td>
                    <td className="py-3 px-4 font-semibold">{banner.name}</td>
                    <td className="py-3 px-4">{banner.position}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        banner.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {banner.status}
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
    </main>
  )
}
