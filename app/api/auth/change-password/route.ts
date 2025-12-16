import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcryptjs from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, oldPassword, newPassword } = await request.json()

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 1. Get user
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('password')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 2. Verify old password
    const isPasswordValid = await bcryptjs.compare(oldPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Mật khẩu cũ không chính xác' },
        { status: 400 }
      )
    }

    // 3. Hash new password
    const salt = await bcryptjs.genSalt(10)
    const hashedPassword = await bcryptjs.hash(newPassword, salt)

    // 4. Update password
    const { error: updateError } = await supabase
      .from('User')
      .update({ password: hashedPassword })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
