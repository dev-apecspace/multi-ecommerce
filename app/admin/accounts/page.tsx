import { AccountAccessManager } from '@/components/account-access-manager'

export default function AdminAccountsPage() {
  return <AccountAccessManager scope="admin" endpoint="/api/admin/accounts" />
}
