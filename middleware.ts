import { NextRequest, NextResponse } from 'next/server'
import { hasAccountPermission, requiredAccountPermission } from '@/lib/account-permissions'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  if (pathname === '/' || pathname === '/home') {
    return NextResponse.redirect(new URL('/client', request.url))
  }
  
  let user: any = null
  
  const authToken = request.cookies.get('auth_token')?.value
  if (authToken) {
    try {
      user = JSON.parse(authToken)
    } catch {
      user = null
    }
  }

  const denyLimitedAccount = (scope: 'admin' | 'seller') => {
    const permissions = Array.isArray(user?.permissions) ? user.permissions as string[] : undefined
    if (!permissions) return null
    if (user?.accountScope !== scope) return '__deny__'
    return requiredAccountPermission(scope, pathname)
  }

  const isApiRequest = pathname.startsWith('/api/')

  if (pathname === '/auth/security' && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const sellerCampaignRead = pathname.startsWith('/api/admin/campaigns') && request.method === 'GET' && user?.role === 'vendor'
  if (sellerCampaignRead) {
    if (user.status !== 'active' && user.status !== 'approved') return NextResponse.json({ error: 'Tài khoản chưa được kích hoạt.' }, { status: 403 })
    if (Array.isArray(user.permissions) && (user.accountScope !== 'seller' || !hasAccountPermission('seller', user.permissions, 'promotions'))) return NextResponse.json({ error: 'Bạn chưa được cấp quyền khuyến mãi.' }, { status: 403 })
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/complaint-categories') || pathname.startsWith('/api/complaints')) {
    if (user?.role === 'admin') {
      const permission = denyLimitedAccount('admin')
      if (permission && !hasAccountPermission('admin', user.permissions, 'complaints')) return NextResponse.json({ error: 'Bạn chưa được cấp quyền phản ánh & khiếu nại.' }, { status: 403 })
    }
  }

  if (pathname === '/api/auth/vendor-approval' && user?.role === 'admin') {
    const permission = denyLimitedAccount('admin')
    if (permission && !hasAccountPermission('admin', user.permissions, 'vendors')) return NextResponse.json({ error: 'Bạn chưa được cấp quyền quản lý nhà cung cấp.' }, { status: 403 })
  }

  // Seller order confirmation is a shared legacy endpoint outside /api/seller.
  // Keep customer order APIs public to this middleware, but enforce the seller
  // orders grant on this state-changing action.
  if (/^\/api\/orders\/[^/]+\/confirm-payment$/.test(pathname) && user?.role === 'vendor') {
    if (Array.isArray(user.permissions) && (user.accountScope !== 'seller' || !hasAccountPermission('seller', user.permissions, 'orders'))) {
      return NextResponse.json({ error: 'Bạn chưa được cấp quyền xử lý đơn hàng.' }, { status: 403 })
    }
  }

  if (user?.role === 'vendor' && pathname === '/api/seller/registration-state') return NextResponse.next()
  if (user?.role === 'vendor' && pathname === '/api/seller/vendor-warning-acceptance') return NextResponse.next()

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!user || user.role !== 'admin') {
      return isApiRequest
        ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        : NextResponse.redirect(new URL('/auth/login', request.url))
    }
    const permission = denyLimitedAccount('admin')
    const adminStatisticsRead = pathname === '/api/admin/statistics' && request.method === 'GET'
    const dashboardVendorList = pathname === '/api/admin/vendors' && request.method === 'GET' && request.nextUrl.searchParams.has('status') && Number(request.nextUrl.searchParams.get('limit')) <= 10
    const hasRequiredPermission = adminStatisticsRead
      ? hasAccountPermission('admin', user.permissions, 'dashboard') || hasAccountPermission('admin', user.permissions, 'finance')
      : dashboardVendorList
        ? hasAccountPermission('admin', user.permissions, 'dashboard') || hasAccountPermission('admin', user.permissions, 'vendors')
        : permission ? hasAccountPermission('admin', user.permissions, permission) : true
    if (permission && !hasRequiredPermission) {
      return isApiRequest
        ? NextResponse.json({ error: 'Bạn chưa được cấp quyền truy cập chức năng này.' }, { status: 403 })
        : NextResponse.redirect(new URL('/auth/access-denied', request.url))
    }
  }

  if (pathname.startsWith('/seller') || pathname.startsWith('/api/seller')) {
    if (!user) {
      return isApiRequest
        ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        : NextResponse.redirect(new URL('/auth/login?type=vendor', request.url))
    }

    if (user.role !== 'vendor' && user.role !== 'admin') {
      if (user.role === 'customer' && pathname === '/seller') return NextResponse.next()
      return isApiRequest
        ? NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        : NextResponse.redirect(new URL('/client', request.url))
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

    if (user.role === 'vendor') {
      const permission = denyLimitedAccount('seller')
      if (permission && !hasAccountPermission('seller', user.permissions, permission)) {
        return isApiRequest
          ? NextResponse.json({ error: 'Bạn chưa được cấp quyền truy cập chức năng này.' }, { status: 403 })
          : NextResponse.redirect(new URL('/auth/access-denied', request.url))
      }
    }
  }

  const protectedClientRoutes = [
    '/client/cart',
    '/client/checkout',
    '/client/favorites',
    '/client/account',
    '/client/order-history',
    '/client/orders',
  ]

  if (pathname.startsWith('/client')) {
    const isProtectedRoute = protectedClientRoutes.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    )

    if (isProtectedRoute) {
      if (!user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      if (user.role !== 'customer' && user.role !== 'vendor' && user.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/home', '/admin/:path*', '/seller/:path*', '/client/:path*', '/auth/security', '/api/admin/:path*', '/api/seller/:path*', '/api/orders/:path*', '/api/complaint-categories/:path*', '/api/complaints/:path*', '/api/auth/vendor-approval'],
}
