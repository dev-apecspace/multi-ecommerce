"use client"

import { Phone, Mail, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function ContactPage() {
  return (
    <main className="container-viewport py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Liên hệ với chúng tôi</h1>
        <p className="text-muted-foreground mb-8">Chúng tôi sẵn sàng trả lời các câu hỏi của bạn 24/7</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Contact Info */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Điện thoại</h3>
                  <p className="text-muted-foreground">1900.123.456</p>
                  <p className="text-xs text-muted-foreground mt-1">Thứ Hai - Chủ Nhật, 08:00 - 22:00</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Email</h3>
                  <p className="text-muted-foreground">support@sanmdt.vn</p>
                  <p className="text-xs text-muted-foreground mt-1">Thời gian phản hồi: &lt; 2 giờ</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Địa chỉ</h3>
                  <p className="text-muted-foreground">
                    Tầng 5, 123 Đường Đức Chính,
                    <br />
                    Quận 1, TP.HCM, Việt Nam
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Giờ hoạt động</h3>
                  <p className="text-muted-foreground">
                    Thứ 2 - 6: 08:00 - 20:00
                    <br />
                    Thứ 7 - CN: 09:00 - 18:00
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card>
            <CardContent className="p-8">
              <form className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Họ và tên</label>
                  <Input placeholder="Nhập họ và tên" className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="email@example.com" className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium">Chủ đề</label>
                  <Input placeholder="Nhập chủ đề" className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium">Tin nhắn</label>
                  <textarea
                    placeholder="Nhập tin nhắn của bạn..."
                    className="w-full mt-2 p-3 border border-border rounded-lg min-h-32 resize-none"
                  />
                </div>
                <Button className="w-full">Gửi tin nhắn</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Câu hỏi thường gặp</h2>
            <div className="space-y-6">
              {[
                {
                  q: "Làm cách nào để theo dõi đơn hàng?",
                  a: 'Bạn có thể theo dõi đơn hàng trong phần "Đơn hàng của tôi" trong tài khoản người dùng.',
                },
                {
                  q: "Chính sách hoàn trả là gì?",
                  a: "Chúng tôi cho phép hoàn trả trong 30 ngày nếu sản phẩm lỗi hoặc không phù hợp với mô tả.",
                },
                {
                  q: "Làm cách nào để liên hệ với người bán?",
                  a: "Bạn có thể nhắn tin với người bán thông qua trang sản phẩm hoặc trang cửa hàng.",
                },
              ].map((faq, idx) => (
                <div key={idx}>
                  <p className="font-bold mb-2">{faq.q}</p>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
