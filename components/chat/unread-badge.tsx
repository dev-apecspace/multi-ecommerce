export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return <span aria-label={`${count} tin nhắn chưa đọc`} role="status" className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
    {count > 99 ? '99+' : count}
  </span>
}
