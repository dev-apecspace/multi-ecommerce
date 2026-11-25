import { AccountAccessManager } from '@/components/account-access-manager'

export default function SellerAccountsPage() {
  return <AccountAccessManager scope="seller" endpoint="/api/seller/accounts" />
}
