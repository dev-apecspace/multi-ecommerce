"use client"

import { Suspense } from "react"
import AccountContent from "./account-content"

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  )
}
