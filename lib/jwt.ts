import { SignJWT, jwtVerify, JWTPayload } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production-minimum-32-chars'
)

interface TokenPayload extends JWTPayload {
  id: string | number
  email: string
  name: string
  role: 'customer' | 'vendor' | 'admin'
  status: string
  vendorId?: number
  phone?: string
}

export async function generateToken(payload: TokenPayload): Promise<string> {
  try {
    const token = await new SignJWT(payload as Record<string, any>)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)
    return token
  } catch (error) {
    console.error('Failed to generate token:', error)
    throw error
  }
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as unknown as TokenPayload
  } catch (error) {
    return null
  }
}
