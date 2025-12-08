export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  subcategories: string[]
}

export interface Vendor {
  id: string
  name: string
  slug: string
  avatar: string
  banner: string
  status: "pending" | "approved" | "rejected"
  rating: number
  followers: number
  responseTime: number
  description: string
  email: string
  phone: string
  address: string
  joinDate: string
  cmnd: string
  gpkd: string
  commission: number
}

export interface Product {
  id: string
  name: string
  slug: string
  image: string
  images: string[]
  price: number
  originalPrice: number
  rating: number
  reviews: number
  sold: number
  category: string
  vendorId: string
  stock: number
  description: string
  specifications: Record<string, string>
}

export interface Order {
  id: string
  userId: string
  vendorId: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  total: number
  shippingAddress: string
  trackingNumber?: string
  createdAt: string
  updatedAt: string
}

// 15 Categories with subcategories
export const categories: Category[] = [
  {
    id: "1",
    name: "Thời trang",
    slug: "thoi-trang",
    icon: "Shirt",
    subcategories: ["Áo nam", "Áo nữ", "Quần nam", "Quần nữ", "Đầm", "Áo khoác"],
  },
  {
    id: "2",
    name: "Điện tử",
    slug: "dien-tu",
    icon: "Smartphone",
    subcategories: ["Điện thoại", "Laptop", "Máy tính bảng", "Tai nghe", "Sạc", "Pin sạc"],
  },
  {
    id: "3",
    name: "Nhà cửa đời sống",
    slug: "nha-cua-doi-song",
    icon: "Home",
    subcategories: ["Nội thất", "Đồ trang trí", "Đèn", "Thảm", "Rèm", "Gối"],
  },
  {
    id: "4",
    name: "Sức khỏe sắc đẹp",
    slug: "suc-khoe-sac-dep",
    icon: "Heart",
    subcategories: ["Mỹ phẩm", "Chăm sóc da", "Chăm sóc tóc", "Tắm trắng", "Chăm sóc cơ thể"],
  },
  {
    id: "5",
    name: "Mẹ & Bé",
    slug: "me-be",
    icon: "Baby",
    subcategories: ["Sữa bột", "Tã em bé", "Đồ chơi", "Quần áo bé", "Xe đẩy", "Ghế ngồi"],
  },
  {
    id: "6",
    name: "Thể thao",
    slug: "the-thao",
    icon: "Dumbbell",
    subcategories: ["Quần áo thể thao", "Giày thể thao", "Dụng cụ gym", "Xe đạp", "Bóng", "Dây nhảy"],
  },
  {
    id: "7",
    name: "Sách",
    slug: "sach",
    icon: "BookOpen",
    subcategories: ["Sách văn học", "Sách học ngoại ngữ", "Sách kinh tế", "Sách kỹ năng", "Truyện tranh"],
  },
  {
    id: "8",
    name: "Ô tô xe máy",
    slug: "oto-xe-may",
    icon: "Bike",
    subcategories: ["Phụ tùng xe máy", "Phụ tùng ô tô", "Dầu nhớt", "Lốp xe", "Bảo vệ"],
  },
  {
    id: "9",
    name: "Công nghệ",
    slug: "cong-nghe",
    icon: "Cpu",
    subcategories: ["Linh kiện máy tính", "Camera", "Drone", "Thiết bị game", "Phụ kiện"],
  },
  {
    id: "10",
    name: "Thực phẩm",
    slug: "thuc-pham",
    icon: "UtensilsCrossed",
    subcategories: ["Gạo", "Thịt cá", "Rau quả", "Tương gia vị", "Hải sản khô", "Nước uống"],
  },
  {
    id: "11",
    name: "Giày dép",
    slug: "giay-dep",
    icon: "Footprints",
    subcategories: ["Giày nam", "Giày nữ", "Dép nam", "Dép nữ", "Giày bé", "Sandal"],
  },
  {
    id: "12",
    name: "Tú sắc phụ kiện",
    slug: "tu-sac-phu-kien",
    icon: "Sparkles",
    subcategories: ["Túi xách", "Ví", "Đồng hồ", "Trang sức", "Kính", "Mũ"],
  },
  {
    id: "13",
    name: "Đồ dùng học tập",
    slug: "do-dung-hoc-tap",
    icon: "Pencil",
    subcategories: ["Vở sách", "Bút", "Cặp ba lô", "Bộ học tập", "Máy tính", "Kính lúp"],
  },
  {
    id: "14",
    name: "Hàng tiêu dùng khác",
    slug: "hang-tieu-dung-khac",
    icon: "Package",
    subcategories: ["Dụng cụ nhà bếp", "Chải lau", "Bình nước", "Khăn tắm", "Tủ lạnh"],
  },
  {
    id: "15",
    name: "Hàng cấp 2",
    slug: "hang-cap-2",
    icon: "Gift",
    subcategories: ["Hàng cấp 2 điện tử", "Hàng cấp 2 quần áo", "Hàng cấp 2 khác"],
  },
]

// 50 Vendors (10 approved, 5 pending, 5 rejected, 30 additional approved)
export const vendors: Vendor[] = [
  // Approved vendors
  {
    id: "vendor-1",
    name: "FashionPro Store",
    slug: "fashionpro-store",
    avatar: "https://i.pravatar.cc/150?img=1",
    banner: "https://picsum.photos/1200/300?random=1",
    status: "approved",
    rating: 4.8,
    followers: 125000,
    responseTime: 2,
    description: "Chuyên cung cấp quần áo thời trang nam nữ chính hãng",
    email: "fashionpro@example.com",
    phone: "0912345678",
    address: "Hà Nội",
    joinDate: "2023-01-15",
    cmnd: "CMND001",
    gpkd: "GPKD001",
    commission: 10,
  },
  {
    id: "vendor-2",
    name: "TechElite",
    slug: "techelite",
    avatar: "https://i.pravatar.cc/150?img=2",
    banner: "https://picsum.photos/1200/300?random=2",
    status: "approved",
    rating: 4.9,
    followers: 98000,
    responseTime: 1,
    description: "Điện thoại, laptop, thiết bị công nghệ chính hãng",
    email: "tech@example.com",
    phone: "0912345679",
    address: "TP. Hồ Chí Minh",
    joinDate: "2023-02-20",
    cmnd: "CMND002",
    gpkd: "GPKD002",
    commission: 15,
  },
  {
    id: "vendor-3",
    name: "Home Decor Paradise",
    slug: "home-decor-paradise",
    avatar: "https://i.pravatar.cc/150?img=3",
    banner: "https://picsum.photos/1200/300?random=3",
    status: "approved",
    rating: 4.6,
    followers: 45000,
    responseTime: 3,
    description: "Đồ nội thất và trang trí nhà cửa đẹp mắt",
    email: "homedecor@example.com",
    phone: "0912345680",
    address: "Đà Nẵng",
    joinDate: "2023-03-10",
    cmnd: "CMND003",
    gpkd: "GPKD003",
    commission: 12,
  },
  {
    id: "vendor-4",
    name: "Beauty World",
    slug: "beauty-world",
    avatar: "https://i.pravatar.cc/150?img=4",
    banner: "https://picsum.photos/1200/300?random=4",
    status: "approved",
    rating: 4.7,
    followers: 87000,
    responseTime: 2,
    description: "Mỹ phẩm và sản phẩm chăm sóc sắc đẹp cao cấp",
    email: "beauty@example.com",
    phone: "0912345681",
    address: "Hà Nội",
    joinDate: "2023-04-05",
    cmnd: "CMND004",
    gpkd: "GPKD004",
    commission: 10,
  },
  {
    id: "vendor-5",
    name: "Kids World",
    slug: "kids-world",
    avatar: "https://i.pravatar.cc/150?img=5",
    banner: "https://picsum.photos/1200/300?random=5",
    status: "approved",
    rating: 4.5,
    followers: 56000,
    responseTime: 2,
    description: "Đồ chơi, quần áo và sản phẩm cho trẻ em",
    email: "kids@example.com",
    phone: "0912345682",
    address: "TP. Hồ Chí Minh",
    joinDate: "2023-05-12",
    cmnd: "CMND005",
    gpkd: "GPKD005",
    commission: 12,
  },
  {
    id: "vendor-6",
    name: "Sports Gear",
    slug: "sports-gear",
    avatar: "https://i.pravatar.cc/150?img=6",
    banner: "https://picsum.photos/1200/300?random=6",
    status: "approved",
    rating: 4.4,
    followers: 34000,
    responseTime: 3,
    description: "Giày thể thao, quần áo thể thao, dụng cụ tập luyện",
    email: "sports@example.com",
    phone: "0912345683",
    address: "Cần Thơ",
    joinDate: "2023-06-18",
    cmnd: "CMND006",
    gpkd: "GPKD006",
    commission: 11,
  },
  {
    id: "vendor-7",
    name: "Book Paradise",
    slug: "book-paradise",
    avatar: "https://i.pravatar.cc/150?img=7",
    banner: "https://picsum.photos/1200/300?random=7",
    status: "approved",
    rating: 4.8,
    followers: 67000,
    responseTime: 1,
    description: "Sách, truyện, tạp chí uy tín",
    email: "books@example.com",
    phone: "0912345684",
    address: "Hà Nội",
    joinDate: "2023-07-22",
    cmnd: "CMND007",
    gpkd: "GPKD007",
    commission: 10,
  },
  {
    id: "vendor-8",
    name: "Auto Parts Pro",
    slug: "auto-parts-pro",
    avatar: "https://i.pravatar.cc/150?img=8",
    banner: "https://picsum.photos/1200/300?random=8",
    status: "approved",
    rating: 4.3,
    followers: 28000,
    responseTime: 2,
    description: "Phụ tùng ô tô và xe máy chất lượng cao",
    email: "autoparts@example.com",
    phone: "0912345685",
    address: "TP. Hồ Chí Minh",
    joinDate: "2023-08-30",
    cmnd: "CMND008",
    gpkd: "GPKD008",
    commission: 13,
  },
  {
    id: "vendor-9",
    name: "Tech Accessories",
    slug: "tech-accessories",
    avatar: "https://i.pravatar.cc/150?img=9",
    banner: "https://picsum.photos/1200/300?random=9",
    status: "approved",
    rating: 4.6,
    followers: 52000,
    responseTime: 2,
    description: "Phụ kiện công nghệ, camera, drone, thiết bị game",
    email: "techacces@example.com",
    phone: "0912345686",
    address: "Hải Phòng",
    joinDate: "2023-09-14",
    cmnd: "CMND009",
    gpkd: "GPKD009",
    commission: 12,
  },
  {
    id: "vendor-10",
    name: "Fresh Foods",
    slug: "fresh-foods",
    avatar: "https://i.pravatar.cc/150?img=10",
    banner: "https://picsum.photos/1200/300?random=10",
    status: "approved",
    rating: 4.7,
    followers: 78000,
    responseTime: 2,
    description: "Thực phẩm tươi sống, gạo, hải sản khô",
    email: "foods@example.com",
    phone: "0912345687",
    address: "Hà Nội",
    joinDate: "2023-10-20",
    cmnd: "CMND010",
    gpkd: "GPKD010",
    commission: 10,
  },
  // Pending vendors (5)
  {
    id: "vendor-11",
    name: "Pending Shop 1",
    slug: "pending-shop-1",
    avatar: "https://i.pravatar.cc/150?img=11",
    banner: "https://picsum.photos/1200/300?random=11",
    status: "pending",
    rating: 0,
    followers: 0,
    responseTime: 0,
    description: "Chờ duyệt",
    email: "pending1@example.com",
    phone: "0912345688",
    address: "Hà Nội",
    joinDate: "2024-11-01",
    cmnd: "CMND011",
    gpkd: "GPKD011",
    commission: 0,
  },
  {
    id: "vendor-12",
    name: "Pending Shop 2",
    slug: "pending-shop-2",
    avatar: "https://i.pravatar.cc/150?img=12",
    banner: "https://picsum.photos/1200/300?random=12",
    status: "pending",
    rating: 0,
    followers: 0,
    responseTime: 0,
    description: "Chờ duyệt",
    email: "pending2@example.com",
    phone: "0912345689",
    address: "TP. Hồ Chí Minh",
    joinDate: "2024-11-02",
    cmnd: "CMND012",
    gpkd: "GPKD012",
    commission: 0,
  },
  {
    id: "vendor-13",
    name: "Pending Shop 3",
    slug: "pending-shop-3",
    avatar: "https://i.pravatar.cc/150?img=13",
    banner: "https://picsum.photos/1200/300?random=13",
    status: "pending",
    rating: 0,
    followers: 0,
    responseTime: 0,
    description: "Chờ duyệt",
    email: "pending3@example.com",
    phone: "0912345690",
    address: "Đà Nẵng",
    joinDate: "2024-11-03",
    cmnd: "CMND013",
    gpkd: "GPKD013",
    commission: 0,
  },
  {
    id: "vendor-14",
    name: "Pending Shop 4",
    slug: "pending-shop-4",
    avatar: "https://i.pravatar.cc/150?img=14",
    banner: "https://picsum.photos/1200/300?random=14",
    status: "pending",
    rating: 0,
    followers: 0,
    responseTime: 0,
    description: "Chờ duyệt",
    email: "pending4@example.com",
    phone: "0912345691",
    address: "Cần Thơ",
    joinDate: "2024-11-04",
    cmnd: "CMND014",
    gpkd: "GPKD014",
    commission: 0,
  },
  {
    id: "vendor-15",
    name: "Pending Shop 5",
    slug: "pending-shop-5",
    avatar: "https://i.pravatar.cc/150?img=15",
    banner: "https://picsum.photos/1200/300?random=15",
    status: "pending",
    rating: 0,
    followers: 0,
    responseTime: 0,
    description: "Chờ duyệt",
    email: "pending5@example.com",
    phone: "0912345692",
    address: "Hải Phòng",
    joinDate: "2024-11-05",
    cmnd: "CMND015",
    gpkd: "GPKD015",
    commission: 0,
  },
  // Rejected vendors (5)
  {
    id: "vendor-16",
    name: "Rejected Shop 1",
    slug: "rejected-shop-1",
    avatar: "https://i.pravatar.cc/150?img=16",
    banner: "https://picsum.photos/1200/300?random=16",
    status: "rejected",
    rating: 0,
    followers: 0,
    responseTime: 0,
    description: "Bị từ chối",
    email: "rejected1@example.com",
    phone: "0912345693",
    address: "Hà Nội",
    joinDate: "2024-10-01",
    cmnd: "CMND016",
    gpkd: "GPKD016",
    commission: 0,
  },
  {
    id: "vendor-17",
    name: "Rejected Shop 2",
    slug: "rejected-shop-2",
    avatar: "https://i.pravatar.cc/150?img=17",
    banner: "https://picsum.photos/1200/300?random=17",
    status: "rejected",
    rating: 0,
    followers: 0,
    responseTime: 0,
    description: "Bị từ chối",
    email: "rejected2@example.com",
    phone: "0912345694",
    address: "TP. Hồ Chí Minh",
    joinDate: "2024-10-02",
    cmnd: "CMND017",
    gpkd: "GPKD017",
    commission: 0,
  },
  {
    id: "vendor-18",
    name: "Rejected Shop 3",
    slug: "rejected-shop-3",
    avatar: "https://i.pravatar.cc/150?img=18",
    banner: "https://picsum.photos/1200/300?random=18",
    status: "rejected",
    rating: 0,
    followers: 0,
    responseTime: 0,
    description: "Bị từ chối",
    email: "rejected3@example.com",
    phone: "0912345695",
    address: "Đà Nẵng",
    joinDate: "2024-10-03",
    cmnd: "CMND018",
    gpkd: "GPKD018",
    commission: 0,
  },
  {
    id: "vendor-19",
    name: "Rejected Shop 4",
    slug: "rejected-shop-4",
    avatar: "https://i.pravatar.cc/150?img=19",
    banner: "https://picsum.photos/1200/300?random=19",
    status: "rejected",
    rating: 0,
    followers: 0,
    responseTime: 0,
    description: "Bị từ chối",
    email: "rejected4@example.com",
    phone: "0912345696",
    address: "Cần Thơ",
    joinDate: "2024-10-04",
    cmnd: "CMND019",
    gpkd: "GPKD019",
    commission: 0,
  },
  {
    id: "vendor-20",
    name: "Rejected Shop 5",
    slug: "rejected-shop-5",
    avatar: "https://i.pravatar.cc/150?img=20",
    banner: "https://picsum.photos/1200/300?random=20",
    status: "rejected",
    rating: 0,
    followers: 0,
    responseTime: 0,
    description: "Bị từ chối",
    email: "rejected5@example.com",
    phone: "0912345697",
    address: "Hải Phòng",
    joinDate: "2024-10-05",
    cmnd: "CMND020",
    gpkd: "GPKD020",
    commission: 0,
  },
  // Additional 30 approved vendors
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `vendor-${21 + i}`,
    name: `Shop ${21 + i}`,
    slug: `shop-${21 + i}`,
    avatar: `https://i.pravatar.cc/150?img=${21 + i}`,
    banner: `https://picsum.photos/1200/300?random=${21 + i}`,
    status: "approved" as const,
    rating: 4.0 + Math.random() * 0.9,
    followers: Math.floor(Math.random() * 100000),
    responseTime: Math.floor(Math.random() * 5) + 1,
    description: `Cửa hàng kinh doanh đa ngành hàng`,
    email: `vendor${21 + i}@example.com`,
    phone: `091234${5698 + i}`,
    address: ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng"][i % 5],
    joinDate: `2023-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    cmnd: `CMND${String(21 + i).padStart(3, "0")}`,
    gpkd: `GPKD${String(21 + i).padStart(3, "0")}`,
    commission: 10,
  })),
]

// 500 Products across categories
export const products: Product[] = [
  // Generate products across all categories
  ...Array.from({ length: 500 }, (_, i) => {
    const categoryIndex = i % 15
    const category = categories[categoryIndex]
    const vendorIndex = i % 40 // Use only first 40 approved vendors for products
    const vendor = vendors.find((v) => v.status === "approved") || vendors[0]

    const basePrice = Math.floor(Math.random() * 5000000) + 50000
    const discountPercent = Math.floor(Math.random() * 60) + 5

    return {
      id: `product-${i + 1}`,
      name: `Sản phẩm ${category.name} ${i + 1}`,
      slug: `san-pham-${category.slug}-${i + 1}`,
      image: `https://picsum.photos/300/300?random=${i + 1}`,
      images: [
        `https://picsum.photos/300/300?random=${i + 1}`,
        `https://picsum.photos/300/300?random=${i + 100}`,
        `https://picsum.photos/300/300?random=${i + 200}`,
        `https://picsum.photos/300/300?random=${i + 300}`,
      ],
      price: Math.floor(basePrice * (1 - discountPercent / 100)),
      originalPrice: basePrice,
      rating: 3.5 + Math.random() * 1.5,
      reviews: Math.floor(Math.random() * 1000),
      sold: Math.floor(Math.random() * 10000),
      category: category.id,
      vendorId: vendors[vendorIndex % vendors.length].id,
      stock: Math.floor(Math.random() * 500) + 10,
      description: `Mô tả chi tiết sản phẩm ${i + 1}. Sản phẩm chất lượng cao, đã kiểm định, bảo hành chính hãng.`,
      specifications: {
        "Chất liệu": ["Da", "Vải", "Kim loại", "Nhựa", "Gỗ"][Math.floor(Math.random() * 5)],
        "Màu sắc": ["Đen", "Trắng", "Xanh", "Đỏ", "Vàng"][Math.floor(Math.random() * 5)],
        "Kích thước": ["S", "M", "L", "XL", "XXL"][Math.floor(Math.random() * 5)],
        "Xuất xứ": ["Việt Nam", "Trung Quốc", "Thái Lan", "Hàn Quốc", "Nhật Bản"][Math.floor(Math.random() * 5)],
        "Bảo hành": ["6 tháng", "1 năm", "2 năm", "3 năm"][Math.floor(Math.random() * 4)],
      },
    }
  }),
]

// 100 Orders with various statuses
export const orders: Order[] = [
  ...Array.from({ length: 100 }, (_, i) => {
    const statuses: Array<"pending" | "processing" | "shipped" | "delivered" | "cancelled"> = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    const vendorIndex = Math.floor(Math.random() * 10) // Only approved vendors
    const vendor = vendors[vendorIndex]

    const itemCount = Math.floor(Math.random() * 5) + 1
    const items = Array.from({ length: itemCount }, () => {
      const product = products[Math.floor(Math.random() * products.length)]
      return {
        productId: product.id,
        quantity: Math.floor(Math.random() * 5) + 1,
        price: product.price,
      }
    })

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const createdDate = new Date(2024, 0, 1 + Math.floor(Math.random() * 335))
    const updatedDate = new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000)

    return {
      id: `order-${String(i + 1).padStart(6, "0")}`,
      userId: `user-${Math.floor(Math.random() * 1000) + 1}`,
      vendorId: vendor.id,
      status,
      items,
      total: Math.floor(total),
      shippingAddress: `${Math.floor(Math.random() * 999) + 1} Đường ${["Nguyễn Trãi", "Lê Duẩn", "Trần Hưng Đạo", "Hoàng Diệu", "Đinh Tiên Hoàng"][Math.floor(Math.random() * 5)]}, Quận ${Math.floor(Math.random() * 12) + 1}, TP. Hồ Chí Minh`,
      trackingNumber: Math.random() > 0.3 ? `VNP${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined,
      createdAt: createdDate.toISOString(),
      updatedAt: updatedDate.toISOString(),
    }
  }),
]
