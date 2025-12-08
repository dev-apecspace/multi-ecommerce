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
    title: "Giftcard Sàn TMĐT",
    subtitle: "Tặng người thân",
    image: "/gift-card-assortment.png",
    link: "/giftcards",
    color: "from-purple-400 to-purple-500",
  },
]

export function PromotionalBlocks() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Khuyến mãi hôm nay</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {blocks.map((block) => (
          <Link
            key={block.id}
            href={block.link}
            className="group relative h-32 md:h-40 rounded-lg overflow-hidden cursor-pointer"
          >
            <Image
              src={block.image || "/placeholder.svg"}
              alt={block.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${block.color} opacity-50`} />
            <div className="absolute inset-0 flex flex-col justify-end p-3 text-white">
              <h3 className="font-bold text-sm md:text-base">{block.title}</h3>
              <p className="text-xs opacity-90">{block.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
