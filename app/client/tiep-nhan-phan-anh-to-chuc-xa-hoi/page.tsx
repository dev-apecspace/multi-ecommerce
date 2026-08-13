"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function SocialOrganizationFeedbackPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  return (
    <main className="container-viewport py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <nav aria-label="Điều hướng trang" className="mb-5 text-sm text-slate-500">
          <Link href="/client" className="hover:text-primary">Trang chủ</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span aria-current="page">Phản ánh tổ chức xã hội</span>
        </nav>
        <div className="mb-8 border-l-4 border-primary pl-5 sm:pl-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-primary">Kênh tiếp nhận</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Tiếp nhận đánh giá, phản ánh Website
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Dành cho tổ chức xã hội gửi đánh giá, phản ánh và kiến nghị về hoạt động của Website.
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            {submitted ? (
              <div className="py-8 text-center" role="status">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
                <h2 className="mt-5 text-xl font-semibold text-slate-900">Đã tiếp nhận phản ánh</h2>
                <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
                  Cảm ơn Quý tổ chức đã gửi thông tin. Chúng tôi sẽ xem xét và phản hồi trong thời gian phù hợp.
                </p>
                <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>
                  Gửi phản ánh khác
                </Button>
              </div>
            ) : (
              <form
                className="space-y-6"
                onSubmit={async (event) => {
                  event.preventDefault()
                  setSubmitting(true)
                  setError("")
                  const formData = new FormData(event.currentTarget)
                  try {
                    const response = await fetch("/api/social-organization-feedback", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        organizationName: formData.get("organization-name"),
                        establishmentDecisionNumber: formData.get("decision-number"),
                        content: formData.get("feedback-content"),
                      }),
                    })
                    const result = await response.json()
                    if (!response.ok) throw new Error(result.error)
                    setSubmitted(true)
                  } catch (error) {
                    setError(error instanceof Error ? error.message : "Không thể gửi phản ánh. Vui lòng thử lại.")
                  } finally {
                    setSubmitting(false)
                  }
                }}
              >
                <div className="space-y-2">
                  <label htmlFor="organization-name" className="text-sm font-semibold text-slate-800">
                    Tên tổ chức xã hội <span aria-hidden="true" className="text-destructive">*</span>
                  </label>
                  <Input id="organization-name" name="organization-name" required autoComplete="organization" className="h-11 rounded-sm" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="decision-number" className="text-sm font-semibold text-slate-800">
                    Số quyết định thành lập <span aria-hidden="true" className="text-destructive">*</span>
                  </label>
                  <Input id="decision-number" name="decision-number" required className="h-11 rounded-sm" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="feedback-content" className="text-sm font-semibold text-slate-800">
                    Nội dung <span aria-hidden="true" className="text-destructive">*</span>
                  </label>
                  <Textarea id="feedback-content" name="feedback-content" required rows={7} className="resize-y rounded-sm" />
                </div>
                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                <Button type="submit" size="lg" disabled={submitting} className="h-12 w-full rounded-sm text-base font-bold uppercase tracking-wide">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {submitting ? "Đang gửi" : "Gửi"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
