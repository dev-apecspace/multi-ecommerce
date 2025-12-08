import { Card } from "@/components/ui/card"

export const metadata = {
  title: "Chính sách bảo mật - Sàn TMĐT",
  description: "Chính sách bảo mật thông tin cá nhân trên Sàn TMĐT",
}

export default function PrivacyPage() {
  return (
    <main className="container-viewport py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Chính sách bảo mật</h1>

        <Card className="p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Thông tin chúng tôi thu thập</h2>
            <p className="text-foreground/80 leading-relaxed">
              Chúng tôi thu thập thông tin bạn cung cấp trực tiếp như tên, địa chỉ email, số điện thoại, địa chỉ giao
              hàng, và thông tin thanh toán. Ngoài ra, chúng tôi cũng thu thập thông tin về cách bạn sử dụng trang web
              của chúng tôi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Cách chúng tôi sử dụng thông tin</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground/80">
              <li>Để xử lý đơn hàng của bạn</li>
              <li>Để liên lạc với bạn về đơn hàng</li>
              <li>Để cải thiện dịch vụ của chúng tôi</li>
              <li>Để gửi thông báo về khuyến mãi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Bảo vệ dữ liệu</h2>
            <p className="text-foreground/80 leading-relaxed">
              Chúng tôi sử dụng công nghệ mã hóa SSL để bảo vệ thông tin cá nhân của bạn. Dữ liệu của bạn được lưu trữ
              trên máy chủ an toàn với quyền truy cập bị hạn chế.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Chia sẻ thông tin</h2>
            <p className="text-foreground/80 leading-relaxed">
              Chúng tôi không chia sẻ thông tin cá nhân của bạn với bên thứ ba mà không có sự đồng ý của bạn, ngoại trừ:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/80 mt-2">
              <li>Đối tác thanh toán để xử lý giao dịch</li>
              <li>Công ty vận chuyển để gửi hàng</li>
              <li>Khi yêu cầu bởi pháp luật</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Quyền của bạn</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground/80">
              <li>Quyền truy cập thông tin cá nhân của bạn</li>
              <li>Quyền yêu cầu xóa thông tin</li>
              <li>Quyền yêu cầu chỉnh sửa thông tin</li>
              <li>Quyền từ chối nhận email marketing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Liên hệ</h2>
            <p className="text-foreground/80">
              Nếu bạn có câu hỏi về chính sách bảo mật này, vui lòng liên hệ: privacy@sanmdt.vn
            </p>
          </section>
        </Card>
      </div>
    </main>
  )
}
