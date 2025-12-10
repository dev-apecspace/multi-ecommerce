import { Card } from "@/components/ui/card"

export const metadata = {
  title: "Điều khoản dịch vụ - Sàn TMĐT APECSPACE",
  description: "Điều khoản dịch vụ của Sàn TMĐT APECSPACE",
}

export default function TermsOfServicePage() {
  return (
    <main className="container-viewport py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Điều khoản dịch vụ</h1>

        <Card className="p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Chấp nhận điều khoản</h2>
            <p className="text-foreground/80 leading-relaxed">
              Bằng cách truy cập và sử dụng Sàn TMĐT APECSPACE, bạn chấp nhận tuân thủ các điều khoản này. Nếu bạn không đồng ý
              với bất kỳ phần nào, bạn không được phép sử dụng trang web.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Cấp phép</h2>
            <p className="text-foreground/80 leading-relaxed">
              Chúng tôi cấp cho bạn giấy phép hạn chế, không độc quyền để truy cập và sử dụng trang web này cho mục đích
              cá nhân.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Hạn chế sử dụng</h2>
            <p className="text-foreground/80 leading-relaxed">Bạn không được:</p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/80 mt-2">
              <li>Sử dụng trang web cho mục đích bất hợp pháp</li>
              <li>Vi phạm quyền của bất kỳ bên nào</li>
              <li>Cố gắng truy cập trái phép vào trang web</li>
              <li>Gửi phần mềm độc hại</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Sản phẩm và dịch vụ</h2>
            <p className="text-foreground/80 leading-relaxed">
              Sàn TMĐT APECSPACE cung cấp nền tảng để người bán và người mua giao dịch. Chúng tôi không bán sản phẩm trực tiếp.
              Chúng tôi không đảm bảo chất lượng, độ chính xác hoặc tính hợp pháp của bất kỳ sản phẩm nào.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Giới hạn trách nhiệm</h2>
            <p className="text-foreground/80 leading-relaxed">
              Sàn TMĐT APECSPACE không chịu trách nhiệm cho bất kỳ tổn thất hoặc thiệt hại nào phát sinh từ việc sử dụng trang
              web, bao gồm các tổn thất gián tiếp hoặc không dự đoán được.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Thay đổi điều khoản</h2>
            <p className="text-foreground/80 leading-relaxed">
              Chúng tôi có quyền thay đổi điều khoản này bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay lập tức khi
              đăng trên trang web.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Áp dụng pháp luật</h2>
            <p className="text-foreground/80 leading-relaxed">
              Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam.
            </p>
          </section>
        </Card>
      </div>
    </main>
  )
}
