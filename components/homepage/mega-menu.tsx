"use client"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import {
  Shirt,
  Smartphone,
  Home,
  Heart,
  Baby,
  Dumbbell,
  Book,
  Car,
  Utensils,
  Zap,
  Gamepad2,
  Briefcase,
  ChevronDown,
} from "lucide-react"

const categories = [
  {
    icon: Shirt,
    name: "Thời trang",
    slug: "thoi-trang",
    subcategories: ["Nam", "Nữ", "Trẻ em", "Phụ kiện"],
  },
  {
    icon: Smartphone,
    name: "Điện tử",
    slug: "dien-tu",
    subcategories: ["Điện thoại", "Laptop", "Tablet", "Phụ kiện"],
  },
  {
    icon: Home,
    name: "Nhà cửa & đời sống",
    slug: "nha-cua",
    subcategories: ["Đồ nội thất", "Đồ dùng nhà bếp", "Trang trí", "Chiếu sáng"],
  },
  {
    icon: Heart,
    name: "Sức khỏe & sắc đẹp",
    slug: "suc-khoe",
    subcategories: ["Chăm sóc da", "Trang điểm", "Vitamin", "Y tế"],
  },
  {
    icon: Baby,
    name: "Mẹ & bé",
    slug: "me-be",
    subcategories: ["Đồ chơi", "Quần áo bé", "Sữa & thức ăn", "Xe đẩy"],
  },
  {
    icon: Dumbbell,
    name: "Thể thao",
    slug: "the-thao",
    subcategories: ["Thiết bị tập", "Quần áo thể thao", "Giày", "Phụ kiện"],
  },
  {
    icon: Book,
    name: "Sách",
    slug: "sach",
    subcategories: ["Sách giáo khoa", "Tiểu thuyết", "Sách chuyên ngành", "E-book"],
  },
  {
    icon: Car,
    name: "Ô tô & xe máy",
    slug: "oto-xe-may",
    subcategories: ["Phụ tùng", "Đồ chơi mô hình", "Acessories", "Bảo dưỡng"],
  },
  {
    icon: Utensils,
    name: "Thực phẩm",
    slug: "thuc-pham",
    subcategories: ["Đồ khô cá", "Rượu bia", "Bánh kẹo", "Cà phê chè"],
  },
  {
    icon: Zap,
    name: "Doanh nghiệp",
    slug: "doanh-nghiep",
    subcategories: ["Thiết bị văn phòng", "Công cụ", "Hóa chất", "Dụng cụ"],
  },
  {
    icon: Gamepad2,
    name: "Trò chơi & Sưu tầm",
    slug: "tro-choi",
    subcategories: ["Trò chơi điện tử", "Thẻ bài", "Mô hình", "Đồ sưu tầm"],
  },
  {
    icon: Briefcase,
    name: "Phụ kiện khác",
    slug: "phu-kien-khac",
    subcategories: ["Túi xách", "Ví", "Đồng hồ", "Kính mát"],
  },
]

export function MegaMenu() {
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenCategory(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="container-viewport border-b border-border" ref={menuRef}>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap gap-2 md:gap-0 w-full">
        {categories.map((category) => {
          const IconComponent = category.icon
          const isOpen = openCategory === category.slug

          return (
            <div key={category.slug} className="static md:relative w-full md:w-auto">
              <button
                onClick={() => setOpenCategory(isOpen ? null : category.slug)}
                className="w-full h-auto flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-1.5 p-2 md:px-4 md:py-3 text-sm font-medium hover:text-primary transition-colors rounded-md md:rounded-none"
                aria-expanded={isOpen}
              >
                <IconComponent className="h-5 w-5 md:h-4 md:w-4" />
                <span className="text-[11px] md:text-sm text-center md:text-left leading-tight line-clamp-1 md:line-clamp-none">
                  {category.name}
                </span>
                <ChevronDown
                  className={`h-4 w-4 md:ml-1 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="absolute left-0 top-full w-full md:w-auto md:min-w-[250px] bg-popover border border-border rounded-md md:rounded-md shadow-lg mt-1 md:mt-2 z-50">
                  <div className="p-4">
                    <div className="flex items-center mb-4 pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-base">{category.name}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      {category.subcategories.map((sub) => (
                        <Link
                          key={sub}
                          href={`/client/category/${category.slug}?sub=${sub.toLowerCase()}`}
                          className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                          onClick={() => setOpenCategory(null)}
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
