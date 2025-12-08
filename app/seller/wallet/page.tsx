"use client"

import { useEffect } from "react"
import { Wallet, TrendingUp, Download, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSellerWallet } from "@/hooks/useSupabase"
import { useAuth } from "@/lib/auth-context"

export default function SellerWalletPage() {
  const { user } = useAuth()
  const { data: walletData, loading, error, fetchWallet } = useSellerWallet(user?.vendorId || null)

  useEffect(() => {
    if (user?.vendorId) {
      fetchWallet()
    }
  }, [user?.vendorId, fetchWallet])

  const transactions = Array.isArray(walletData) ? walletData : [
    { id: 1, type: "income", description: "Bán hàng đơn ORD001", amount: 4999000, date: "2025-01-15", status: "Completed" },
    { id: 2, type: "withdraw", description: "Rút tiền", amount: -5000000, date: "2025-01-10", status: "Completed" },
    { id: 3, type: "income", description: "Bán hàng đơn ORD002", amount: 2499000, date: "2025-01-14", status: "Completed" },
  ]

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-center">Đang tải ví tiền...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="p-6">
        <p className="text-center text-red-500">Lỗi: {error}</p>
      </main>
    )
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Ví tiền & Doanh thu</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Số dư ví</p>
                <p className="text-3xl font-bold mt-2">125.45 Triệu</p>
              </div>
              <Wallet className="h-12 w-12 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Doanh thu tháng này</p>
                <p className="text-3xl font-bold text-green-600 mt-2">125.45 Triệu</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">+8% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đang chờ</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">2.5 Triệu</p>
              </div>
              <Send className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Từ các đơn trong vòng 7 ngày</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Lịch sử giao dịch</TabsTrigger>
          <TabsTrigger value="revenue">Doanh thu chi tiết</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lịch sử giao dịch</CardTitle>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Download className="h-4 w-4 mr-2" />
                  Xuất báo cáo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Loại</th>
                      <th className="text-left py-3 px-4">Mô tả</th>
                      <th className="text-left py-3 px-4">Số tiền</th>
                      <th className="text-left py-3 px-4">Ngày</th>
                      <th className="text-left py-3 px-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border hover:bg-muted">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tx.type === "income" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {tx.type === "income" ? "Thu" : "Chi"}
                          </span>
                        </td>
                        <td className="py-3 px-4">{tx.description}</td>
                        <td className={`py-3 px-4 font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                          {tx.amount > 0 ? "+" : ""}{(tx.amount / 1000000).toFixed(2)} Tr
                        </td>
                        <td className="py-3 px-4">{tx.date}</td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Hoàn thành</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Doanh thu chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Chi tiết doanh thu theo sản phẩm và thời gian</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
