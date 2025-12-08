import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  let user: any = null
  
  const authToken = request.cookies.get('auth_token')?.value
  if (authToken) {
    try {
      user = JSON.parse(authToken)
    } catch {
      user = null
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!user || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  if (pathname.startsWith('/seller')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login?type=vendor', request.url))
    }

    if (user.role !== 'vendor' && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/client', request.url))
    }

    if (user.role === 'vendor' && user.status !== 'active' && user.status !== 'approved') {
      const allowedPendingRoutes = [
        '/seller/documents',
        '/seller/profile',
        '/seller/settings',
        '/seller/pending-approval',
      ]
      
      const isAllowedRoute = allowedPendingRoutes.some(route => 
        pathname === route || pathname.startsWith(route + '/')
      )

      if (!isAllowedRoute && pathname !== '/seller') {
        return NextResponse.redirect(new URL('/seller/pending-approval', request.url))
      }
    }
  }

  if (pathname.startsWith('/client')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (user.role !== 'customer' && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/seller', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/seller/:path*', '/client/:path*'],
}
