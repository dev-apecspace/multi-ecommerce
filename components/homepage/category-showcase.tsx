"use client"

import Image from "next/image"
import Link from "next/link"

const categories = [
  {
    id: 1,
    name: "Thời trang",
    slug: "thoi-trang",
    icon: "👔",
    color: "from-blue-400 to-blue-600",
    image: "/category-fashion.jpg",
  },
  {
    id: 2,
    name: "Điện tử",
    slug: "dien-tu",
    icon: "📱",
    color: "from-purple-400 to-purple-600",
    image: "/category-electronics.jpg",
  },
  {
    id: 3,
    name: "Nhà & Vườn",
    slug: "nha-vua",
    icon: "🏠",
    color: "from-green-400 to-green-600",
    image: "/category-home.jpg",
  },
  {
    id: 4,
    name: "Thể thao",
    slug: "the-thao",
    icon: "⚽",
    color: "from-orange-400 to-orange-600",
    image: "/category-sports.jpg",
  },
  {
    id: 5,
    name: "Sách & Giáo dục",
    slug: "sach-giao-duc",
    icon: "📚",
    color: "from-red-400 to-red-600",
    image: "/category-books.jpg",
  },
  {
    id: 6,
    name: "Làm đẹp & Sức khỏe",
    slug: "lam-dep-suc-khoe",
    icon: "💄",
    color: "from-pink-400 to-pink-600",
    image: "/category-beauty.jpg",
  },
]

export function CategoryShowcase() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">🛍️ Danh mục nổi bật</h2>
        <p className="text-sm text-muted-foreground mt-1">Khám phá hàng ngàn sản phẩm từ các danh mục yêu thích</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/client/category/${category.slug}`}
            className="group"
          >
            <div className={`relative h-24 md:h-28 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer`}>
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-40 group-hover:opacity-30 transition-opacity duration-300`} />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="text-3xl md:text-4xl mb-2 group-hover:scale-125 transition-transform duration-300">
                  {category.icon}
                </div>
                <p className="text-xs md:text-sm font-semibold text-center line-clamp-2 px-1">{category.name}</p>
              </div>

              <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/40 rounded-xl transition-all duration-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
