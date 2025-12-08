"use client"

import { Briefcase, MapPin, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CareerPage() {
  const jobs = [
    { id: 1, title: "Kỹ sư phát triển Full Stack", department: "Công nghệ", location: "Hà Nội", type: "Toàn thời gian", level: "Senior" },
    { id: 2, title: "Chuyên gia tiếp thị số", department: "Tiếp thị", location: "TP.HCM", type: "Toàn thời gian", level: "Mid-level" },
    { id: 3, title: "Chuyên viên dịch vụ khách hàng", department: "Hỗ trợ khách hàng", location: "Hà Nội", type: "Toàn thời gian", level: "Entry" },
  ]

  return (
    <main className="bg-gradient-to-b from-white to-gray-50 dark:from-slate-950 dark:to-slate-900">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16">
        <div className="container-viewport">
          <h1 className="text-4xl font-bold mb-4">Cơ hội nghề nghiệp tại Sàn TMĐT</h1>
          <p className="text-lg opacity-90">Gia nhập đội ngũ của chúng tôi và hình dung tương lai thương mại điện tử</p>
        </div>
      </div>

      <div className="container-viewport py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <h3 className="font-semibold text-lg mb-2">Đội ngũ tuyệt vời</h3>
              <p className="text-sm text-muted-foreground">Làm việc với những chuyên gia tài năng</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-8">Vị trí tuyển dụng</h2>
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                        <span>{job.department}</span>
                        <span>{job.location}</span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">{job.type}</span>
                      </div>
                    </div>
                    <Button className="bg-orange-600 hover:bg-orange-700">Ứng tuyển</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}