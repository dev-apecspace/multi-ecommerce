import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { password, hash } = await request.json()

    const isValid = await bcryptjs.compare(password, hash)

    const newHash = await bcryptjs.hash(password, 10)

    return NextResponse.json({
      passwordProvided: password,
      hashInDb: hash,
      compareResult: isValid,
      newHashGenerated: newHash,
      bcryptjsVersion: '3.0.3',
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
