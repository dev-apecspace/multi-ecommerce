import Link from "next/link"
import { LegalDocumentLink } from "@/components/legal-document-link"

export const metadata = {
  title: "Điều khoản dịch vụ - Sàn TMĐT APECSPACE",
  description: "Điều khoản sử dụng dịch vụ của Sàn TMĐT APECSPACE",
}

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <article className="mx-auto max-w-7xl bg-white px-6 py-10 shadow-sm sm:px-10">
        <Link href="/client" className="text-sm text-primary underline underline-offset-4">
          Về trang chủ
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">Điều khoản dịch vụ</h1>
        <p className="mt-5 leading-7 text-slate-600">
          Điều khoản sử dụng dịch vụ được công bố và cập nhật tại trang này.
        </p>
        <div className="mt-6">
          <LegalDocumentLink code="terms-of-service" pendingText="Điều khoản dịch vụ đang được cập nhật." />
        </div>
      </article>
    </main>
  )
}
