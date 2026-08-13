import { LegalContentPending } from "@/components/legal-content-pending"

export const metadata = {
  title: "Điều kiện hoạt động - Sàn TMĐT APECSPACE",
  description: "Điều kiện hoạt động của Sàn TMĐT APECSPACE",
}

export default function OperatingRegulationsPage() {
  return (
    <LegalContentPending
      title="Điều kiện hoạt động"
      description="Thông tin về điều kiện hoạt động và trách nhiệm của các bên trên Sàn TMĐT APECSPACE."
      documentCode="operating-regulations"
    />
  )
}
