interface RevenueReturn {
  status: string
  returnType?: string
  refundAmount?: number | string | null
  orderItemId?: number
  quantity?: number
}

interface RevenueOrder {
  status: string
  paymentStatus?: string | null
  paymentMethod?: string | null
  total?: number | string | null
  Return?: RevenueReturn[] | null
}

const amount = (value: unknown) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, number) : 0
}

export const isDeductibleReturn = (record: RevenueReturn) => record.returnType === 'return'
  && ['approved', 'refund_confirmed', 'shipped', 'received', 'restocked', 'completed'].includes(record.status)

export const isExcludedFromRevenue = (order: RevenueOrder) =>
  ['cancelled', 'returned'].includes(order.status) || order.paymentStatus === 'refunded'

export const isRevenueEligible = (order: RevenueOrder) => !isExcludedFromRevenue(order) && (
  ['delivered', 'completed'].includes(order.status)
  || (['pending', 'processing', 'shipped'].includes(order.status)
    && ['bank', 'wallet'].includes(order.paymentMethod || '') && order.paymentStatus === 'paid')
)

export const getRetainedOrderValue = (order: RevenueOrder) => Math.max(0, amount(order.total)
  - (order.Return || []).filter(isDeductibleReturn).reduce((sum, record) => sum + amount(record.refundAmount), 0))

export const getOrderRevenue = (order: RevenueOrder) => isRevenueEligible(order) ? getRetainedOrderValue(order) : 0

export const isPendingRevenue = (order: RevenueOrder) => !isExcludedFromRevenue(order) && !isRevenueEligible(order)
