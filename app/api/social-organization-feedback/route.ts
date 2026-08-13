import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function GET() {
  const { data, error } = await supabase
    .from("SocialOrganizationFeedback")
    .select("id, organizationName, establishmentDecisionNumber, content, createdAt")
    .order("createdAt", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const organizationName = typeof body.organizationName === "string" ? body.organizationName.trim() : ""
    const establishmentDecisionNumber =
      typeof body.establishmentDecisionNumber === "string" ? body.establishmentDecisionNumber.trim() : ""
    const content = typeof body.content === "string" ? body.content.trim() : ""

    if (!organizationName || !establishmentDecisionNumber || !content) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ các trường bắt buộc." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("SocialOrganizationFeedback")
      .insert([{ organizationName, establishmentDecisionNumber, content }])
      .select("id, organizationName, establishmentDecisionNumber, content, createdAt")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 })
  }
}
