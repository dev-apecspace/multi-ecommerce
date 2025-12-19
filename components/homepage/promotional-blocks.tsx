"use client"

import Image from "next/image"
import Link from "next/link"

const blocks = [
  {
    id: 1,
    title: "Voucher 20%",
    subtitle: "Cho tất cả sản phẩm",
    image: "/voucher-discount-20.jpg",
    link: "/vouchers",
    color: "from-orange-400 to-orange-500",
  },
  {
    id: 2,
    title: "Hoàn tiền 50%",
    subtitle: "Tối đa 100K",
    image: "/cashback-refund-50.jpg",
    link: "/promotions/cashback",
    color: "from-pink-400 to-pink-500",
  },
  {
    id: 3,
    title: "Mua 2 tặng 1",
    subtitle: "Áo & giày được chọn",
    image: "/buy-2-get-1-free.jpg",
    link: "/promotions/buy2get1",
    color: "from-cyan-400 to-cyan-500",
  },
  {
    id: 4,
    title: "Miễn phí vận chuyển",
    subtitle: "Đơn từ 0đ",
    image: "/free-shipping-banner.png",
    link: "/promotions/freeship",
    color: "from-teal-400 to-teal-500",
  },
  {
    id: 5,
    title: "Trả góp 0%",
    subtitle: "Lên đến 12 tháng",
    image: "/installment-0-percent.jpg",
    link: "/promotions/installment",
    color: "from-lime-400 to-lime-500",
  },
  {
    id: 6,
    title: "Giftcard Sàn TMĐT APECSPACE",
    subtitle: "Tặng người thân",
    image: "/gift-card-assortment.png",
    link: "/giftcards",
    color: "from-purple-400 to-purple-500",
  },
]

export function PromotionalBlocks() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">🎉 Khuyến mãi hôm nay</h2>
          <p className="text-sm text-muted-foreground mt-1">Các ưu đãi đặc biệt dành cho bạn</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {blocks.map((block) => (
          <Link
            key={block.id}
            href={block.link}
            className="group relative h-40 md:h-48 rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
          >
            <Image
              src={block.image || "/placeholder.svg"}
              alt={block.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${block.color} opacity-60 group-hover:opacity-50 transition-opacity duration-300`} />
            
            <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="font-bold text-base md:text-lg leading-tight group-hover:translate-y-1 transition-transform duration-300">{block.title}</h3>
                <p className="text-xs md:text-sm opacity-90 mt-1">{block.subtitle}</p>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                <span className="text-sm font-semibold">Xem ngay</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-gray-900 px-3 py-1 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              ⭐ Ưu đãi
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
