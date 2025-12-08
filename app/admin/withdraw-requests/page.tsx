"use client"

import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminWithdrawRequestsPage() {
  const requests = [
    { id: 1, seller: "Samsung Việt Nam", amount: 50000000, date: "2025-01-15", status: "Pending" },
    { id: 2, seller: "Thế Giới Di Động", amount: 25000000, date: "2025-01-14", status: "Pending" },
    { id: 3, seller: "Điện Máy Xanh", amount: 15000000, date: "2025-01-13", status: "Approved" },
  ]

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Quản lý yêu cầu rút tiền</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Chờ duyệt</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">12</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Đã phê duyệt</p>
            <p className="text-3xl font-bold text-green-600 mt-2">248</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Bị từ chối</p>
            <p className="text-3xl font-bold text-red-600 mt-2">5</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu rút tiền</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Seller</th>
                  <th className="text-left py-3 px-4">Số tiền</th>
                  <th className="text-left py-3 px-4">Ngày yêu cầu</th>
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-left py-3 px-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-border hover:bg-muted">
                    <td className="py-3 px-4">{req.id}</td>
                    <td className="py-3 px-4">{req.seller}</td>
                    <td className="py-3 px-4 font-semibold">{req.amount.toLocaleString()}đ</td>
                    <td className="py-3 px-4">{req.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        req.status === "Approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      {req.status === "Pending" && (
                        <>
                          <button className="text-green-600 hover:text-green-800"><Check className="h-4 w-4" /></button>
                          <button className="text-red-600 hover:text-red-800"><X className="h-4 w-4" /></button>
                        </>
                      )}
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
