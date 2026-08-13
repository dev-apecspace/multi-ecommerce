import { NextRequest, NextResponse } from 'next/server'
import { mkdir, stat, unlink, writeFile } from 'fs/promises'
import { spawn } from 'child_process'
import path from 'path'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

export const runtime = 'nodejs'

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024
const MAX_STORED_SIZE = 5 * 1024 * 1024

async function compressPdf(inputPath: string, outputPath: string) {
  const executables = process.platform === 'win32'
    ? ['gswin64c.exe', 'gswin32c.exe']
    : ['gs']

  for (const executable of executables) {
    const result = await new Promise<boolean>((resolve) => {
      const process = spawn(executable, [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=/ebook',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        `-sOutputFile=${outputPath}`,
        inputPath,
      ])
      process.on('error', () => resolve(false))
      process.on('close', (code) => resolve(code === 0))
    })
    if (result) return true
  }
  return false
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!isAdmin(auth)) return unauthorizedResponse()
  const file = (await request.formData()).get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Vui lòng chọn tệp.' }, { status: 400 })
  if (file.size > MAX_UPLOAD_SIZE) return NextResponse.json({ error: 'Tệp PDF gốc tối đa 20MB.' }, { status: 400 })
  const extension = path.extname(file.name).toLowerCase()
  if (file.type !== 'application/pdf' || extension !== '.pdf') {
    return NextResponse.json({ error: 'Chỉ hỗ trợ tệp PDF để đảm bảo xem trực tiếp và tối ưu dung lượng.' }, { status: 400 })
  }
  try {
    const data = Buffer.from(await file.arrayBuffer())
    if (!data.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      return NextResponse.json({ error: 'Tệp tải lên không phải PDF hợp lệ.' }, { status: 400 })
    }
    const baseName = path.basename(file.name, extension).replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'tai-lieu'
    const storedName = `${Date.now()}-${crypto.randomUUID()}-${baseName}${extension}`
    const uploadDirectory = path.join(process.cwd(), 'public', 'uploads', 'chinh-sach')
    await mkdir(uploadDirectory, { recursive: true })
    const outputPath = path.join(uploadDirectory, storedName)
    const temporaryPath = path.join(uploadDirectory, `${crypto.randomUUID()}.source.pdf`)
    await writeFile(temporaryPath, data)

    const compressed = await compressPdf(temporaryPath, outputPath)
    const shouldUseCompressed = compressed && (await stat(outputPath)).size < data.length
    if (!shouldUseCompressed) await writeFile(outputPath, data)
    await unlink(temporaryPath).catch(() => undefined)

    const finalSize = (await stat(outputPath)).size
    if (finalSize > MAX_STORED_SIZE) {
      await unlink(outputPath).catch(() => undefined)
      return NextResponse.json({ error: 'Tài liệu sau xử lý vượt quá 5MB. Vui lòng nén file trước khi tải lên.' }, { status: 400 })
    }
    return NextResponse.json({
      fileName: file.name,
      fileUrl: `/uploads/chinh-sach/${storedName}`,
      originalSize: data.length,
      finalSize,
      compressed: shouldUseCompressed,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tải tệp.' }, { status: 500 })
  }
}
