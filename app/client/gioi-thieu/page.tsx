import { Card } from "@/components/ui/card"

export const metadata = {
  title: "Giới thiệu - Sàn TMĐT APECSPACE",
  description: "Thông tin về Sàn TMĐT APECSPACE - sàn thương mại điện tử hàng đầu Việt Nam",
}

export default function AboutPage() {
  return (
    <main className="container-viewport py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Giới thiệu Sàn TMĐT APECSPACE</h1>

        <Card className="p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4">Về chúng tôi</h2>
            <p className="text-foreground/80 leading-relaxed">
              Sàn TMĐT APECSPACE là nền tảng thương mại điện tử hàng đầu Việt Nam, nơi kết nối hàng triệu người mua và người bán.
              Chúng tôi cam kết đảm bảo chất lượng sản phẩm, an toàn giao dịch và dịch vụ khách hàng tốt nhất.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Sứ mệnh</h2>
            <p className="text-foreground/80 leading-relaxed">
              Giúp các doanh nghiệp và cá nhân có thể bán sản phẩm của mình trực tuyến một cách dễ dàng, đồng thời cung
              cấp cho người tiêu dùng một nơi mua sắm an toàn, tiện lợi và có nhiều lựa chọn.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Lịch sử</h2>
            <p className="text-foreground/80 leading-relaxed">
              Được thành lập năm 2025, Sàn TMĐT APECSPACE đã phát triển thành một trong những sàn giao dịch điện tử uy tín nhất
              tại Việt Nam với hơn 1 triệu sản phẩm từ hàng ngàn người bán.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Cam kết</h2>
            <ul className="space-y-2 text-foreground/80">
              <li>✓ Bảo vệ thông tin người dùng</li>
              <li>✓ Đảm bảo chất lượng sản phẩm</li>
              <li>✓ Hỗ trợ khách hàng 24/7</li>
              <li>✓ Giao dịch an toàn và công bằng</li>
            </ul>
          </section>
        </Card>
      </div>
    </main>
  )
}
