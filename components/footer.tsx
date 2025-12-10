import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white mt-16">
      {/* Main Footer */}
      <div className="container-viewport py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
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
                <Link href="/client/chinh-sach-bao-mat" className="hover:text-white transition">
                  Bảo mật thông tin
                </Link>
              </li>
              <li>
                <Link href="/client/dieu-khoan-dich-vu" className="hover:text-white transition">
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link href="/client/quy-che-hoat-dong" className="hover:text-white transition">
                  Quy chế hoạt động
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
            <p>Giấy phép ĐKKD số 0123456789 do Sở KH&ĐT cấp</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
