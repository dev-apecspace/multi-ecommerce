import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcryptjs from 'bcryptjs'
import { getAuthFromRequest } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) return NextResponse.json({ error: 'Vui lòng đăng nhập lại.' }, { status: 401 })

    const { oldPassword, newPassword } = await request.json()

    if (typeof oldPassword !== 'string' || !oldPassword || typeof newPassword !== 'string' || !newPassword) {
      return NextResponse.json({ error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.' }, { status: 400 })
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return NextResponse.json({ error: 'Mật khẩu mới phải có từ 8 đến 128 ký tự.' }, { status: 400 })
    }
    if (oldPassword === newPassword) {
      return NextResponse.json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại.' }, { status: 400 })
    }

    // The account identity always comes from the verified session, never from the request body.
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('password')
      .eq('id', auth.userId)
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
      .eq('id', auth.userId)

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
