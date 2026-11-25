export type AccountScope = 'admin' | 'seller'

export const ACCOUNT_PERMISSION_OPTIONS: Record<AccountScope, { key: string; label: string }[]> = {
  admin: [
    { key: 'dashboard', label: 'Tổng quan sàn' },
    { key: 'accounts', label: 'Quản lý tài khoản & phân quyền' },
    { key: 'users', label: 'Người dùng' },
    { key: 'products', label: 'Sản phẩm' },
    { key: 'categories', label: 'Danh mục' },
    { key: 'vendors', label: 'Nhà cung cấp' },
    { key: 'orders', label: 'Đơn hàng' },
    { key: 'promotions', label: 'Khuyến mãi' },
    { key: 'vouchers', label: 'Voucher' },
    { key: 'reviews', label: 'Đánh giá' },
    { key: 'banners', label: 'Banner & quảng cáo' },
    { key: 'legal', label: 'Tài liệu chính sách' },
    { key: 'complaints', label: 'Phản ánh & khiếu nại' },
    { key: 'policy-acceptances', label: 'Lịch sử chấp nhận' },
    { key: 'vendor-warning', label: 'Cảnh báo nhà bán hàng' },
    { key: 'social-feedback', label: 'Phản ánh tổ chức xã hội' },
    { key: 'monthly-fees', label: 'Phí hợp tác hàng tháng' },
    { key: 'finance', label: 'Tài chính & đối soát' },
    { key: 'settings', label: 'Cài đặt hệ thống' },
  ],
  seller: [
    { key: 'dashboard', label: 'Tổng quan shop' },
    { key: 'accounts', label: 'Quản lý tài khoản nhân viên' },
    { key: 'products', label: 'Sản phẩm' },
    { key: 'orders', label: 'Đơn hàng bán' },
    { key: 'returns', label: 'Đơn trả hàng' },
    { key: 'customers', label: 'Khách hàng' },
    { key: 'promotions', label: 'Khuyến mãi' },
    { key: 'vouchers', label: 'Voucher' },
    { key: 'chat', label: 'Chat với khách' },
    { key: 'transactions', label: 'Giao dịch & doanh thu' },
    { key: 'monthly-fees', label: 'Phí hợp tác hàng tháng' },
    { key: 'documents', label: 'Tài liệu shop' },
    { key: 'legal-documents', label: 'Tài liệu chính sách' },
    { key: 'settings', label: 'Hồ sơ & cài đặt shop' },
  ],
}

const ADMIN_ROUTE_PERMISSIONS: [string, string][] = [
  ['/api/complaint-categories', 'complaints'], ['/api/complaints', 'complaints'], ['/api/auth/vendor-approval', 'vendors'],
  ['/admin/accounts', 'accounts'], ['/api/admin/accounts', 'accounts'],
  ['/admin/users', 'users'], ['/api/admin/customers', 'users'],
  ['/admin/products', 'products'], ['/api/admin/products', 'products'],
  ['/admin/categories', 'categories'], ['/api/admin/categories', 'categories'],
  ['/admin/vendors', 'vendors'], ['/api/admin/vendors', 'vendors'], ['/api/admin/vendor-documents', 'vendors'],
  ['/admin/orders', 'orders'], ['/api/admin/orders', 'orders'],
  ['/admin/promotions', 'promotions'], ['/admin/campaigns', 'promotions'], ['/api/admin/promotions', 'promotions'], ['/api/admin/campaigns', 'promotions'],
  ['/admin/vouchers', 'vouchers'], ['/api/admin/vouchers', 'vouchers'],
  ['/admin/reviews', 'reviews'], ['/api/admin/reviews', 'reviews'],
  ['/admin/banners', 'banners'], ['/api/admin/banners', 'banners'],
  ['/admin/legal-documents', 'legal'], ['/api/admin/legal-documents', 'legal'],
  ['/admin/complaints', 'complaints'], ['/api/admin/complaints', 'complaints'],
  ['/admin/policy-acceptances', 'policy-acceptances'], ['/api/admin/policy-acceptances', 'policy-acceptances'],
  ['/admin/vendor-registration-warning', 'vendor-warning'], ['/api/admin/vendor-registration-warning', 'vendor-warning'],
  ['/admin/social-organization-feedback', 'social-feedback'], ['/api/admin/social-organization-feedback', 'social-feedback'],
  ['/admin/vendor-monthly-fees', 'monthly-fees'], ['/api/admin/vendor-monthly-fees', 'monthly-fees'],
  ['/admin/reports', 'finance'], ['/admin/transactions', 'finance'], ['/api/admin/reports', 'finance'], ['/api/admin/transactions', 'finance'],
  ['/api/admin/statistics', 'dashboard'], ['/api/admin/subcategories', 'categories'],
  ['/admin/settings', 'settings'], ['/api/admin/settings', 'settings'],
]

const SELLER_ROUTE_PERMISSIONS: [string, string][] = [
  ['/seller/accounts', 'accounts'], ['/api/seller/accounts', 'accounts'],
  ['/seller/products', 'products'], ['/api/seller/products', 'products'],
  ['/seller/orders', 'orders'], ['/api/seller/orders', 'orders'],
  ['/seller/returns', 'returns'], ['/api/seller/returns', 'returns'],
  ['/seller/customers', 'customers'], ['/api/seller/customers', 'customers'],
  ['/seller/promotions', 'promotions'], ['/api/seller/promotions', 'promotions'], ['/api/seller/campaigns', 'promotions'],
  ['/seller/vouchers', 'vouchers'], ['/api/seller/vouchers', 'vouchers'],
  ['/seller/chat', 'chat'], ['/api/seller/chat', 'chat'],
  ['/seller/transactions', 'transactions'], ['/api/seller/transactions', 'transactions'],
  ['/seller/monthly-fees', 'monthly-fees'], ['/api/seller/monthly-fees', 'monthly-fees'],
  ['/seller/documents', 'documents'], ['/api/seller/documents', 'documents'], ['/api/seller/guides', 'documents'],
  ['/seller/legal-documents', 'legal-documents'], ['/api/seller/legal-documents', 'legal-documents'],
  ['/seller/settings', 'settings'], ['/api/seller/settings', 'settings'], ['/api/seller/shop', 'settings'], ['/api/seller/vendor', 'settings'], ['/api/seller/vendor-upload', 'settings'],
  ['/api/seller/registration-state', 'dashboard'], ['/api/seller/vendor-warning-acceptance', 'dashboard'],
  ['/api/seller/upload', 'products'], ['/api/seller/wallet', 'transactions'], ['/api/seller/withdrawals', 'transactions'],
]

export function requiredAccountPermission(scope: AccountScope, pathname: string): string {
  const mappings = scope === 'admin' ? ADMIN_ROUTE_PERMISSIONS : SELLER_ROUTE_PERMISSIONS
  const match = mappings.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  if (match) return match[1]
  if (scope === 'admin') return pathname === '/admin' || pathname === '/api/admin' ? 'dashboard' : '__deny__'
  return pathname === '/seller' || pathname === '/seller/dashboard' || pathname === '/api/seller/dashboard' ? 'dashboard' : '__deny__'
}

export function hasAccountPermission(scope: AccountScope, permissions: string[] | null | undefined, permission: string): boolean {
  if (permission === '__deny__') return false
  return permissions == null || (ACCOUNT_PERMISSION_OPTIONS[scope].some((item) => item.key === permission) && permissions.includes(permission))
}

export function accountLandingPath(scope: AccountScope, permissions?: string[]): string {
  if (permissions === undefined) return scope === 'admin' ? '/admin' : '/seller/dashboard'
  const paths: Record<string, string> = scope === 'admin' ? {
    dashboard: '/admin', accounts: '/admin/accounts', users: '/admin/users', products: '/admin/products', categories: '/admin/categories',
    vendors: '/admin/vendors', orders: '/admin/orders', promotions: '/admin/promotions', vouchers: '/admin/vouchers', reviews: '/admin/reviews',
    banners: '/admin/banners', legal: '/admin/legal-documents', complaints: '/admin/complaints', 'policy-acceptances': '/admin/policy-acceptances',
    'vendor-warning': '/admin/vendor-registration-warning', 'social-feedback': '/admin/social-organization-feedback',
    'monthly-fees': '/admin/vendor-monthly-fees', finance: '/admin/reports', settings: '/admin/settings',
  } : {
    dashboard: '/seller/dashboard', accounts: '/seller/accounts', products: '/seller/products', orders: '/seller/orders', returns: '/seller/returns',
    customers: '/seller/customers', promotions: '/seller/promotions', vouchers: '/seller/vouchers', chat: '/seller/chat',
    transactions: '/seller/transactions', 'monthly-fees': '/seller/monthly-fees', documents: '/seller/documents',
    'legal-documents': '/seller/legal-documents', settings: '/seller/settings',
  }
  const firstAllowed = ACCOUNT_PERMISSION_OPTIONS[scope].find((option) => permissions.includes(option.key))
  return firstAllowed ? paths[firstAllowed.key] : '/auth/access-denied'
}
