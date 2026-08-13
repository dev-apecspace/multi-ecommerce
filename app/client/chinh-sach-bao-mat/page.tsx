import Link from "next/link"
import { LegalDocumentLink } from "@/components/legal-document-link"

export const metadata = {
  title: "Chính sách bảo mật - Sàn TMĐT APECSPACE",
  description: "Chính sách bảo mật thông tin cá nhân trên Sàn TMĐT APECSPACE",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <article className="mx-auto max-w-7xl bg-white px-6 py-10 shadow-sm sm:px-10">
        <Link href="/client" className="text-sm text-primary underline underline-offset-4">
          Về trang chủ
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">Chính sách bảo mật</h1>
        <p className="mt-5 leading-7 text-slate-600">
          Chính sách bảo vệ và xử lý dữ liệu cá nhân được công bố tại trang này.
        </p>
        <div className="mt-6">
          <LegalDocumentLink code="privacy-policy" pendingText="Chính sách bảo mật đang được cập nhật." />
        </div>
      </article>
    </main>
  )
}
