import { Check, Circle, Clock3, Upload } from 'lucide-react'

export function PaymentProofProgress({ status }: { status?: string | null }) {
  const submitted = status === 'submitted'
  const paid = status === 'paid'
  const steps = [
    { label: 'Thanh toán', icon: paid || submitted ? Check : Circle, active: true, done: paid || submitted },
    { label: 'Gửi minh chứng', icon: paid || submitted ? Check : Upload, active: submitted || paid, done: paid },
    { label: paid ? 'Đã xác nhận' : 'Shop đối soát', icon: paid ? Check : Clock3, active: paid, done: paid },
  ]
  return <ol className="my-4 grid grid-cols-3 overflow-hidden rounded-lg border border-blue-100 bg-white text-center text-[11px] font-medium text-slate-500 dark:border-blue-900 dark:bg-slate-950 dark:text-slate-300">
    {steps.map(({ label, icon: Icon, active, done }, index) => <li key={label} className={`relative flex min-w-0 flex-col items-center gap-1 px-2 py-2.5 ${active ? 'text-blue-700 dark:text-blue-300' : ''} ${index < steps.length - 1 ? 'border-r border-blue-100 dark:border-blue-900' : ''}`}>
      <Icon className={`h-4 w-4 ${done ? 'text-emerald-600' : active ? 'text-blue-600' : 'text-slate-400'}`} />
      <span className="leading-4">{label}</span>
    </li>)}
  </ol>
}
