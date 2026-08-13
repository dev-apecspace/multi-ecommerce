"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SocialOrganizationFeedbackTable } from "@/components/social-organization-feedback-table"

export default function AdminSocialOrganizationFeedbackPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Phản ánh tổ chức xã hội</h1>
        <p className="mt-1 text-sm text-muted-foreground">Theo dõi toàn bộ đánh giá, phản ánh và kiến nghị được gửi từ website.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách phản ánh</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SocialOrganizationFeedbackTable emptyMessage="Chưa có phản ánh nào được gửi." />
        </CardContent>
      </Card>
    </div>
  )
}
