
import { Truck, ShieldCheck, Headphones, CreditCard } from "lucide-react"

const features = [
  {
    icon: Truck,
    title: "Miễn phí vận chuyển",
    description: "Cho đơn hàng từ 500k",
  },
  {
    icon: ShieldCheck,
    title: "Bảo hành chính hãng",
    description: "Cam kết 100% chính hãng",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    description: "Luôn sẵn sàng hỗ trợ bạn",
  },
  {
    icon: CreditCard,
    title: "Thanh toán an toàn",
    description: "Đa dạng phương thức thanh toán",
  },
]

export function TrustSection() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 py-8 border-t border-gray-100 dark:border-gray-800">
      {features.map((feature, index) => (
        <div key={index} className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <feature.icon className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-sm md:text-base mb-1">{feature.title}</h3>
          <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
        </div>
      ))}
    </div>
  )
}
