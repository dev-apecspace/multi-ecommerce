"use client"

import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminCategoriesPage() {
  const categories = [
    { id: 1, name: "Điện thoại", products: 1200, status: "Active" },
    { id: 2, name: "Laptop", products: 450, status: "Active" },
    { id: 3, name: "Phụ kiện", products: 3200, status: "Active" },
    { id: 4, name: "Thời trang", products: 5600, status: "Active" },
    { id: 5, name: "Giày dép", products: 2100, status: "Active" },
  ]

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Quản lý danh mục</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Tên danh mục</th>
                  <th className="text-left py-3 px-4">Số sản phẩm</th>
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-left py-3 px-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-border hover:bg-muted">
                    <td className="py-3 px-4">{cat.id}</td>
                    <td className="py-3 px-4 font-semibold">{cat.name}</td>
                    <td className="py-3 px-4">{cat.products}</td>
                    <td className="py-3 px-4">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Active</span>
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
