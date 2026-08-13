import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export const runtime = "nodejs"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const { data: document, error } = await supabase
    .from("LegalDocument")
    .select("fileName, fileUrl")
    .eq("code", code)
    .single()

  if (error || !document) return NextResponse.json({ error: "Không tìm thấy tài liệu." }, { status: 404 })

  try {
    const isLocalFile = document.fileUrl.startsWith("/uploads/chinh-sach/")
    const source = isLocalFile ? null : await fetch(document.fileUrl)
    if (!isLocalFile && (!source?.ok || !source.body)) return NextResponse.json({ error: "Không thể mở tài liệu." }, { status: 502 })
    const extension = path.extname(document.fileName).toLowerCase()
    const contentType = source?.headers.get("content-type") || ({ ".pdf": "application/pdf", ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }[extension] || "application/octet-stream")
    const safeName = document.fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, "-")
      .replace(/[\r\n"]/g, "")
    const body = isLocalFile
      ? new Uint8Array(await readFile(path.join(process.cwd(), "public", "uploads", "chinh-sach", path.basename(decodeURIComponent(document.fileUrl)))))
      : source!.body
    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
        "Cache-Control": "private, max-age=300",
      },
    })
  } catch (readError) {
    console.error("Legal document viewer failed", { code, fileUrl: document.fileUrl, readError })
    return NextResponse.json({ error: "Không thể mở tệp chính sách trên máy chủ." }, { status: 502 })
  }
}
