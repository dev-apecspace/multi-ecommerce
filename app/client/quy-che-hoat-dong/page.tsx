import { Card } from "@/components/ui/card"

export const metadata = {
  title: "Quy chế hoạt động - Sàn TMĐT",
  description: "Quy chế hoạt động của Sàn TMĐT - sàn thương mại điện tử hàng đầu Việt Nam",
}

export default function OperatingRegulationsPage() {
  return (
    <main className="container-viewport py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Quy chế hoạt động Sàn TMĐT</h1>

        <Card className="p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">I. Định nghĩa</h2>
            <div className="space-y-3 text-foreground/80 leading-relaxed">
              <p>
                1. Sàn TMĐT (Sàn Thương mại Điện tử) là nền tảng trực tuyến kết nối các bên mua và bán hàng hóa, dịch
                vụ.
              </p>
              <p>2. Người bán: Là cá nhân hoặc tổ chức có đăng ký kinh doanh hợp pháp trên Sàn TMĐT.</p>
              <p>3. Người mua: Là người tiêu dùng truy cập và mua hàng trên Sàn TMĐT.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">II. Quyền và trách nhiệm của người bán</h2>
            <div className="space-y-3 text-foreground/80 leading-relaxed">
              <p>
                <strong>Quyền:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Được bán hàng hóa, dịch vụ hợp pháp trên Sàn TMĐT</li>
                <li>Được nhận doanh thu từ bán hàng trừ hoa hồng của Sàn</li>
                <li>Được hỗ trợ kỹ thuật từ Sàn TMĐT</li>
              </ul>
              <p className="mt-4">
                <strong>Trách nhiệm:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Cung cấp thông tin chính xác, không lừa dối</li>
                <li>Tuân thủ pháp luật Việt Nam</li>
                <li>Đảm bảo chất lượng hàng hóa</li>
                <li>Gửi hàng đúng thời hạn</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">III. Quyền và trách nhiệm của người mua</h2>
            <div className="space-y-3 text-foreground/80 leading-relaxed">
              <p>
                <strong>Quyền:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Được mua hàng hóa, dịch vụ với giá cạnh tranh</li>
                <li>Được bảo vệ thông tin cá nhân</li>
                <li>Được hoàn trả hàng nếu không hài lòng</li>
              </ul>
              <p className="mt-4">
                <strong>Trách nhiệm:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Thanh toán đầy đủ và đúng hạn</li>
                <li>Cung cấp thông tin giao hàng chính xác</li>
                <li>Kiểm tra hàng khi nhận</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">IV. Chính sách hoa hồng</h2>
            <div className="space-y-3 text-foreground/80 leading-relaxed">
              <p>Sàn TMĐT tính hoa hồng 5% từ mỗi giao dịch thành công.</p>
              <p>Hoa hồng được tính trên giá cuối cùng mà người mua thanh toán (sau khi áp dụng khuyến mãi).</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">V. Xử lý vi phạm</h2>
            <div className="space-y-3 text-foreground/80 leading-relaxed">
              <p>Sàn TMĐT có quyền:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Cảnh báo</li>
                <li>Tạm khóa tài khoản</li>
                <li>Đóng cửa hàng</li>
                <li>Khóa vĩnh viễn</li>
              </ul>
              <p className="mt-4">Tuỳ theo mức độ vi phạm quy chế.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">VI. Liên hệ</h2>
            <p className="text-foreground/80">Nếu có thắc mắc, vui lòng liên hệ: support@sanmdt.vn hoặc 1900.123.456</p>
          </section>
        </Card>
      </div>
    </main>
  )
}
