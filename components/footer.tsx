import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone } from "lucide-react"
import { CompanyInformation } from "@/components/company-information"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white mt-16">
      {/* Main Footer */}
      <div className="container-viewport py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 xl:grid-cols-6 mb-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">Về Sàn TMĐT APECSPACE</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/client/gioi-thieu" className="hover:text-white transition">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/client/career" className="hover:text-white transition">
                  Tuyển dụng
                </Link>
              </li>
              <li>
                <Link href="/client/lien-he" className="hover:text-white transition">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Policy */}
          <div>
            <h3 className="font-bold text-lg mb-4">Chính sách</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/client/chinh-sach-bao-mat" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  Bảo mật thông tin
                </Link>
              </li>
              <li>
                <Link href="/client/dieu-khoan-dich-vu" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link href="/client/dieu-kien-hoat-dong" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  Điều kiện hoạt động
                </Link>
              </li>
              <li>
                <Link href="/client/co-che-giai-quyet-tranh-chap" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  Cơ chế giải quyết tranh chấp
                </Link>
              </li>
            </ul>
          </div>

          {/* Social organization feedback */}
          <div>
            <h3 className="font-bold text-lg mb-4">Phản ánh tổ chức xã hội</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <Link
                  href="/client/tiep-nhan-phan-anh-to-chuc-xa-hoi"
                  className="group flex items-start gap-2 hover:text-white transition"
                >
                  <span aria-hidden="true" className="mt-0.5 text-primary transition-transform group-hover:translate-x-0.5">›</span>
                  <span>Tiếp nhận đánh giá, phản ánh, kiến nghị của tổ chức xã hội</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/client/danh-sach-phan-anh-to-chuc-xa-hoi"
                  className="group flex items-start gap-2 hover:text-white transition"
                >
                  <span aria-hidden="true" className="mt-0.5 text-primary transition-transform group-hover:translate-x-0.5">›</span>
                  <span>Danh sách đánh giá, phản ánh, kiến nghị của tổ chức xã hội</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Seller */}
          <div>
            <h3 className="font-bold text-lg mb-4">Bán hàng</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/seller/register" className="hover:text-white transition">
                  Đăng ký bán hàng
                </Link>
              </li>
              <li>
                <Link href="/seller/dashboard" className="hover:text-white transition">
                  Bảng điều khiển
                </Link>
              </li>
              <li>
                <Link href="/seller/guide" className="hover:text-white transition">
                  Hướng dẫn bán hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                1900.123.456
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                support@sanmdt.vn
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold text-lg mb-4">Theo dõi</h3>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-primary transition">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary transition">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary transition">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary transition">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700 pt-8">
          <div className="text-center text-sm text-gray-400 space-y-2">
            <p>© 2025 Sàn TMĐT APECSPACE. Tất cả các quyền được bảo lưu.</p>
          </div>
          <CompanyInformation className="mt-6 text-center text-gray-300" />
        </div>
      </div>
    </footer>
  )
}
