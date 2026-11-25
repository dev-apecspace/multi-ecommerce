import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './jwt'

export interface AuthPayload {
  userId: string | number
  vendorId?: number
  role: string
  status: string
  permissions?: string[]
  accountScope?: 'admin' | 'seller'
}

export async function getAuthFromRequest(request: NextRequest): Promise<AuthPayload | null> {
  const token = request.cookies.get('token')?.value

  if (!token) {
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
    permissions: Array.isArray(decoded.permissions) ? decoded.permissions : undefined,
    accountScope: decoded.accountScope === 'admin' || decoded.accountScope === 'seller' ? decoded.accountScope : undefined,
  }
}

export function isVendor(auth: AuthPayload | null): boolean {
  return auth?.role === 'vendor' && !!auth.vendorId && !['inactive', 'rejected'].includes(String(auth.status).toLowerCase())
}

export function isAdmin(auth: AuthPayload | null): boolean {
  return auth?.role === 'admin'
}

export function hasPermission(auth: AuthPayload | null, permission: string): boolean {
  if (!auth) return false
  const scope = auth.role === 'admin' ? 'admin' : auth.role === 'vendor' ? 'seller' : null
  if (!scope || (auth.accountScope && auth.accountScope !== scope)) return false
  return auth.permissions === undefined || auth.permissions.includes(permission)
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}
