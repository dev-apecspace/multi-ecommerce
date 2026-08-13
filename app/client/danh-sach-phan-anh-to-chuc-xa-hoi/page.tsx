import Link from "next/link"
import { ArrowRight, ClipboardList } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SocialOrganizationFeedbackTable } from "@/components/social-organization-feedback-table"

export const metadata = {
  title: "Danh sách phản ánh của tổ chức xã hội - Sàn TMĐT APECSPACE",
  description: "Danh sách đánh giá, phản ánh, kiến nghị của tổ chức xã hội",
}

export default function SocialOrganizationFeedbackListPage() {
  return (
    <main className="container-viewport py-10 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Điều hướng trang" className="mb-5 text-sm text-slate-500">
          <Link href="/client" className="hover:text-primary">Trang chủ</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span aria-current="page">Phản ánh tổ chức xã hội</span>
        </nav>

        <div className="border-l-4 border-primary pl-5 sm:pl-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-primary">Công khai thông tin</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Danh sách đánh giá, phản ánh, kiến nghị của tổ chức xã hội
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Các phản ánh đủ điều kiện công bố sẽ được cập nhật minh bạch tại đây.
          </p>
        </div>

        <Card className="mt-8 overflow-hidden border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Danh sách phản ánh đã công bố</p>
              <p className="mt-0.5 text-xs text-slate-500">Cập nhật khi có dữ liệu được phê duyệt công khai.</p>
            </div>
          </div>
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-white px-5 py-3 text-xs font-medium text-slate-500 sm:hidden">
              Vuốt ngang để xem đầy đủ các cột thông tin.
            </div>
            <SocialOrganizationFeedbackTable emptyMessage="Chưa có phản ánh nào được công bố." />
            <p className="border-t border-slate-200 px-5 py-3 text-xs leading-5 text-slate-500 sm:px-6">
              Chúng tôi chỉ công bố thông tin sau khi thực hiện quy trình kiểm tra, tiếp nhận và phê duyệt phù hợp.
            </p>
            <div className="px-5 pb-5 sm:px-6">
              <Button asChild className="rounded-sm">
                <Link href="/client/tiep-nhan-phan-anh-to-chuc-xa-hoi">
                  Gửi phản ánh
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
