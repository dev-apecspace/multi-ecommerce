"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ExperimentalModeModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(sessionStorage.getItem("experimental-mode-notice-acknowledged") !== "true")
  }, [])

  const acknowledge = () => {
    sessionStorage.setItem("experimental-mode-notice-acknowledged", "true")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => nextOpen ? setOpen(true) : acknowledge()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <div className="mb-2 rounded-full bg-amber-100 p-3 text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <DialogTitle>Thông báo</DialogTitle>
          <DialogDescription className="text-sm leading-6">
            Website đang hoạt động ở chế độ thử nghiệm, đang thực hiện đăng ký với Bộ Công Thương.
          </DialogDescription>
        </DialogHeader>
        <Button className="w-full" onClick={acknowledge}>
          Tôi đã hiểu
        </Button>
      </DialogContent>
    </Dialog>
  )
}
