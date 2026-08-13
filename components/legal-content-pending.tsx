import { FileText, Scale } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { LegalDocumentLink } from "@/components/legal-document-link"

type LegalContentPendingProps = {
  title: string
  description: string
  documentCode?: string
}

export function LegalContentPending({ title, description, documentCode }: LegalContentPendingProps) {
  return (
    <main className="container-viewport py-10 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="border-l-4 border-primary pl-5 sm:pl-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            Thông tin pháp lý
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
        </div>

        <Card className="mt-8 overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
                Nội dung đang được hoàn thiện
              </div>
            </div>
            <div className="px-6 py-8 sm:px-8 sm:py-10">
              <FileText className="mb-5 h-10 w-10 text-primary" aria-hidden="true" />
              <p className="text-xl font-semibold leading-8 text-slate-900">
                Luật Phong Đăng sẽ soạn gửi lại thông tin.
              </p>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Nội dung sẽ được cập nhật tại trang này ngay sau khi hoàn tất hồ sơ pháp lý.
              </p>
              {documentCode && <div className="mt-5"><LegalDocumentLink code={documentCode} /></div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
