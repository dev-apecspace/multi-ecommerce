import { NextResponse } from 'next/server'

export const revalidate = 86_400

export async function GET() {
  try {
    const response = await fetch('https://api.vietqr.io/v2/banks', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86_400 },
    })
    if (!response.ok) throw new Error(`VietQR responded ${response.status}`)
    const result = await response.json()
    const banks = Array.isArray(result?.data) ? result.data
      .filter((bank: any) => bank?.bin && bank?.code && bank?.shortName && bank?.name)
      .map((bank: any) => ({
        bin: String(bank.bin),
        code: String(bank.code),
        shortName: String(bank.shortName),
        name: String(bank.name),
        logo: typeof bank.logo === 'string' ? bank.logo : '',
      }))
      : []
    return NextResponse.json({ data: banks })
  } catch (error) {
    console.error('VietQR bank list error:', error)
    return NextResponse.json({ error: 'Không thể tải danh sách ngân hàng VietQR.' }, { status: 502 })
  }
}
