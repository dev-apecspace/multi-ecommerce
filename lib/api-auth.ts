import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './jwt'

export interface AuthPayload {
  userId: string | number
  vendorId?: number
  role: string
  status: string
}

export async function getAuthFromRequest(request: NextRequest): Promise<AuthPayload | null> {
  const token = request.cookies.get('token')?.value

  if (!token) {
    console.log('No token in cookies. Available cookies:', Array.from(request.cookies.getSetCookie()).map(c => c.split('=')[0]))
    return null
  }

  const decoded = await verifyToken(token)
  if (!decoded) {
    console.log('Token verification failed for token:', token.substring(0, 20) + '...')
    return null
  }

  console.log('Auth successful:', { userId: decoded.id, vendorId: decoded.vendorId, role: decoded.role })
  return {
    userId: decoded.id,
    vendorId: decoded.vendorId,
    role: decoded.role,
    status: decoded.status,
  }
}

export function isVendor(auth: AuthPayload | null): boolean {
  return auth?.role === 'vendor' && !!auth.vendorId
}

export function isAdmin(auth: AuthPayload | null): boolean {
  return auth?.role === 'admin'
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}
