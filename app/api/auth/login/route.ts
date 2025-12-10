import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcryptjs from 'bcryptjs'
import { generateToken } from '@/lib/jwt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { data: users, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password', debug: 'User not found' },
        { status: 401 }
      )
    }

    const user = users[0]

    const isPasswordValid = await bcryptjs.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password', debug: 'Password mismatch' },
        { status: 401 }
      )
    }

    const allowedStatuses = ['active', 'approved', 'pending', 'pending_approval']
    if (!allowedStatuses.includes(user.status)) {
      return NextResponse.json(
        { error: 'Your account is not active', debug: `Status is ${user.status}` },
        { status: 403 }
      )
    }

    let vendorId: number | undefined

    if (user.role === 'vendor') {
      const { data: vendorData } = await supabase
        .from('Vendor')
        .select('id')
        .eq('userId', user.id)
        .single()

      vendorId = vendorData?.id
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      vendorId,
    }

    const jwtToken = await generateToken(tokenPayload)

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      vendorId,
    }

    const response = NextResponse.json(
      {
        user: userData,
        token: jwtToken,
        message: 'Login successful',
      },
      { status: 200 }
    )

    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    response.cookies.set('auth_token', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
