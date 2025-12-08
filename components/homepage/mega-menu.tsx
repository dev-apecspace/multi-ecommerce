"use client"
import Link from "next/link"
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
} from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

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
  return (
    <div className="container-viewport border-b border-border">
      <NavigationMenu className="w-full justify-start">
        <NavigationMenuList className="gap-0 flex-wrap">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <NavigationMenuItem key={category.slug} className="w-auto">
                <NavigationMenuTrigger className="text-sm font-medium hover:text-primary data-[state=open]:text-primary gap-1.5 px-3 py-3 md:px-4">
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden md:inline">{category.name}</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[200px] md:w-[300px]">
                  <div className="p-4 space-y-2">
                    {category.subcategories.map((sub) => (
                      <Link
                        key={sub}
                        href={`/client/category/${category.slug}?sub=${sub.toLowerCase()}`}
                        className="block px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-sm"
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}
