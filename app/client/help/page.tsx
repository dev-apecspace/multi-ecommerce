"use client"

import { Search, ChevronDown, MessageSquare, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const faqs = [
    { id: 1, question: "Làm thế nào để đặt hàng?", answer: "Bạn có thể đặt hàng bằng cách: 1. Duyệt danh sách sản phẩm 2. Chọn sản phẩm và thêm vào giỏ 3. Hoàn tất thanh toán" },
    { id: 2, question: "Thời gian giao hàng là bao lâu?", answer: "Giao hàng tiêu chuẩn: 3-5 ngày, Giao hàng express: 1-2 ngày" },
    { id: 3, question: "Chính sách đổi trả sản phẩm?", answer: "Bạn có thể đổi/trả sản phẩm trong vòng 30 ngày nếu sản phẩm còn nguyên hộp, không sử dụng" },
  ]

  return (
    <main className="container-viewport py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4 text-center">Trung tâm Trợ giúp</h1>
        <p className="text-center text-muted-foreground mb-8">Tìm câu trả lời cho các câu hỏi của bạn</p>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Input placeholder="Tìm kiếm câu trả lời..." className="pl-10 h-12 text-base" />
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="faq" className="w-full">
        <TabsList>
          <TabsTrigger value="faq">Câu hỏi thường gặp</TabsTrigger>
          <TabsTrigger value="contact">Liên hệ hỗ trợ</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="max-w-3xl mx-auto">
          <div className="space-y-4 mt-8">
            {faqs.map((faq) => (
              <Card key={faq.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full p-6 flex items-start justify-between gap-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-lg">{faq.question}</h3>
                  </div>
                  <ChevronDown className={`h-5 w-5 mt-1 flex-shrink-0 transition-transform ${expandedFaq === faq.id ? "rotate-180" : ""}`} />
                </button>
                {expandedFaq === faq.id && (
                  <CardContent className="px-6 pb-6 border-t">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contact">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">Chat với chúng tôi</h3>
                <p className="text-sm text-muted-foreground mb-4">Trò chuyện trực tiếp với đội hỗ trợ</p>
                <Button variant="outline" className="w-full">Bắt đầu chat</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}