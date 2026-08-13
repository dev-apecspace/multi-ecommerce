"use client"

import { useEffect, useState } from "react"
import { Inbox } from "lucide-react"

export type SocialOrganizationFeedback = {
  id: number
  organizationName: string
  establishmentDecisionNumber: string
  content: string
  createdAt: string
}

type Props = {
  emptyMessage?: string
}

export function SocialOrganizationFeedbackTable({ emptyMessage = "Chưa có phản ánh nào." }: Props) {
  const [items, setItems] = useState<SocialOrganizationFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const response = await fetch("/api/social-organization-feedback")
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        setItems(result.data)
      } catch {
        setError("Không thể tải danh sách phản ánh. Vui lòng thử lại sau.")
      } finally {
        setLoading(false)
      }
    }
    loadFeedback()
  }, [])

  if (loading) return <p className="px-6 py-12 text-center text-sm text-slate-500">Đang tải danh sách phản ánh...</p>
  if (error) return <p className="px-6 py-12 text-center text-sm text-destructive">{error}</p>

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <caption className="sr-only">Danh sách đánh giá, phản ánh, kiến nghị của tổ chức xã hội</caption>
        <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-700">
          <tr>
            <th scope="col" className="w-16 border-b border-slate-200 px-4 py-4 text-center">ID</th>
            <th scope="col" className="min-w-52 border-b border-slate-200 px-4 py-4">Tên tổ chức</th>
            <th scope="col" className="min-w-44 border-b border-slate-200 px-4 py-4">Số quyết định thành lập</th>
            <th scope="col" className="min-w-80 border-b border-slate-200 px-4 py-4">Nội dung</th>
            <th scope="col" className="min-w-28 border-b border-slate-200 px-4 py-4">Ngày gửi</th>
          </tr>
        </thead>
        <tbody className="bg-white text-slate-700">
          {items.length ? items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100 align-top last:border-0">
              <td className="px-4 py-4 text-center font-medium">{item.id}</td>
              <td className="px-4 py-4 font-medium text-slate-900">{item.organizationName}</td>
              <td className="px-4 py-4">{item.establishmentDecisionNumber}</td>
              <td className="max-w-xl whitespace-pre-wrap px-4 py-4 leading-6">{item.content}</td>
              <td className="whitespace-nowrap px-4 py-4">{new Intl.DateTimeFormat("vi-VN").format(new Date(item.createdAt))}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="px-6 py-14 text-center sm:py-16">
                <Inbox className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
                <p className="mt-3 font-medium text-slate-800">{emptyMessage}</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
