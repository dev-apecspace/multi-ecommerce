export const orderStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xử lý', color: 'bg-gray-100 text-gray-800' },
  processing: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Đang giao', color: 'bg-yellow-100 text-yellow-800' },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-800' },
  completed: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
  return_pending: { label: 'Đã gửi yêu cầu trả hàng', color: 'bg-purple-100 text-purple-800' },
  return_approved: { label: 'Đã duyệt yêu cầu trả hàng', color: 'bg-blue-100 text-blue-800' },
  return_refund_confirmed: { label: 'Đã hoàn tiền hàng', color: 'bg-teal-100 text-teal-800' },
  return_shipped: { label: 'Đã trả hàng', color: 'bg-emerald-100 text-emerald-800' },
  returned: { label: 'Đã trả hàng', color: 'bg-indigo-100 text-indigo-800' },
}
