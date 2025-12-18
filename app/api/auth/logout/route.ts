import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { message: 'Logout successful' },
    { status: 200 }
  )

  // Clear all auth-related cookies
  response.cookies.delete('auth_token')
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  // Also clear any other potential auth cookies
  response.cookies.delete('token')
  response.cookies.set('token', '', {
    maxAge: 0,
    path: '/',
  })

  return response
}
