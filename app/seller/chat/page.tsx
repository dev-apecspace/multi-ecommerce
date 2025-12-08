"use client"

import { Search, Send, Phone, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function SellerChatPage() {
  const conversations = [
    { id: 1, customer: "Nguyễn Văn A", lastMessage: "Sản phẩm có còn không?", unread: 2, status: "online" },
    { id: 2, customer: "Trần Thị B", lastMessage: "Cảm ơn, sản phẩm rất tốt!", unread: 0, status: "offline" },
    { id: 3, customer: "Phạm Văn C", lastMessage: "Khi nào giao hàng?", unread: 1, status: "online" },
  ]

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Chat với khách</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-96">
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Cuộc hội thoại</CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-4 space-y-2 overflow-y-auto">
            {conversations.map((conv) => (
              <div key={conv.id} className="p-3 hover:bg-muted rounded cursor-pointer border border-transparent hover:border-border">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{conv.customer}</p>
                  <div className={`w-2 h-2 rounded-full ${conv.status === "online" ? "bg-green-500" : "bg-gray-300"}`}></div>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                {conv.unread > 0 && <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded mt-1 inline-block">{conv.unread}</span>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="border-b flex items-center justify-between">
            <CardTitle>Nguyễn Văn A</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Phone className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm"><Video className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col h-64 p-4">
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              <div className="bg-muted p-3 rounded w-fit max-w-xs">
                <p className="text-sm">Sản phẩm có còn không?</p>
              </div>
              <div className="bg-orange-600 text-white p-3 rounded w-fit max-w-xs ml-auto">
                <p className="text-sm">Có chứ, còn rất nhiều! Bạn muốn đặt bao nhiêu cái?</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Nhập tin nhắn..." className="flex-1" />
              <Button className="bg-orange-600 hover:bg-orange-700"><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
