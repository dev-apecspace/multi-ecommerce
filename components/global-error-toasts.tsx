"use client"

import { useEffect, useRef } from "react"
import { toast } from "@/hooks/use-toast"

const GENERIC_ERROR_MESSAGE = "Thao tác chưa thể hoàn tất. Vui lòng thử lại."

function getSafeMessage(error: unknown) {
  if (error instanceof Error && error.message && error.message.length <= 180) return error.message
  if (typeof error === "string" && error.length <= 180) return error
  return GENERIC_ERROR_MESSAGE
}

function isBrowserExtensionError(error: unknown) {
  const source = error instanceof Error
    ? error.stack || error.message
    : typeof error === "object" && error !== null && "stack" in error
      ? String(error.stack || "")
      : ""
  return /(?:chrome-extension|moz-extension|safari-web-extension):\/\//i.test(source)
}

/** Displays a fallback for errors that would otherwise only reach the console. */
export function GlobalErrorToasts() {
  const lastShownAt = useRef(0)

  useEffect(() => {
    const showError = (error: unknown) => {
      const now = Date.now()
      if (now - lastShownAt.current < 1500) return
      lastShownAt.current = now
      toast({ variant: "destructive", title: "Đã xảy ra lỗi", description: getSafeMessage(error) })
    }
    const onError = (event: ErrorEvent) => {
      if (/ResizeObserver loop/i.test(event.message)) return
      if (/(?:chrome-extension|moz-extension|safari-web-extension):\/\//i.test(event.filename) || isBrowserExtensionError(event.error)) return
      showError(event.error ?? event.message)
    }
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isBrowserExtensionError(event.reason)) return
      showError(event.reason)
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onUnhandledRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [])

  return null
}
