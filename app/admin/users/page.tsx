"use client"

import { Search, Filter, Lock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function AdminUsersPage() {
  const users = [
    { id: 1, name: "Nguyễn Văn A", email: "nguyenvana@email.com", phone: "0912345678", joinDate: "2024-01-15", status: "Active" },
    { id: 2, name: "Trần Thị B", email: "tranthib@email.com", phone: "0987654321", joinDate: "2024-02-20", status: "Active" },
    { id: 3, name: "Phạm Văn C", email: "phamvanc@email.com", phone: "0901234567", joinDate: "2024-03-10", status: "Blocked" },
  ]

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Người dùng khách hàng</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Tổng người dùng</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">15,420</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            <p className="text-3xl font-bold text-green-600 mt-2">14,850</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Bị khóa</p>
            <p className="text-3xl font-bold text-red-600 mt-2">570</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Hôm nay</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">120</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách người dùng</CardTitle>
            <div className="flex gap-2">
              <Input placeholder="Tìm kiếm..." className="w-48" />
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Tên</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Điện thoại</th>
                  <th className="text-left py-3 px-4">Ngày tham gia</th>
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-left py-3 px-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted">
                    <td className="py-3 px-4">{user.id}</td>
                    <td className="py-3 px-4 font-semibold">{user.name}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">{user.phone}</td>
                    <td className="py-3 px-4">{user.joinDate}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Lock className="h-4 w-4 cursor-pointer text-yellow-600" />
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
