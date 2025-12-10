export const vendors = [
  { id: 1, name: "Samsung Việt Nam", status: "approved", joinDate: "2024-01-15", rating: 4.8, products: 145, followers: 5420 },
  { id: 2, name: "Thế Giới Di Động", status: "approved", joinDate: "2024-02-20", rating: 4.7, products: 2340, followers: 98765 },
  { id: 3, name: "Điện Máy Xanh", status: "pending", joinDate: "2024-11-25", rating: 4.6, products: 1200, followers: 34567 },
  { id: 4, name: "Apple Store", status: "approved", joinDate: "2024-03-10", rating: 4.9, products: 320, followers: 156000 },
  { id: 5, name: "Uniqlo Việt Nam", status: "approved", joinDate: "2024-04-05", rating: 4.6, products: 890, followers: 45678 },
  { id: 6, name: "Zara Vietnam", status: "approved", joinDate: "2024-05-12", rating: 4.5, products: 650, followers: 32145 },
  { id: 7, name: "Oriflame", status: "approved", joinDate: "2024-06-18", rating: 4.4, products: 540, followers: 28900 },
  { id: 8, name: "Elipsport", status: "approved", joinDate: "2024-07-22", rating: 4.7, products: 780, followers: 52341 },
]

export const categories = [
  { slug: "dien-tu", name: "Điện tử", icon: "📱", subcategories: [
    { slug: "dien-thoai", name: "Điện thoại" },
    { slug: "may-tinh-bang", name: "Máy tính bảng" },
    { slug: "may-tinh-xach-tay", name: "Máy tính xách tay" },
    { slug: "tai-nghe", name: "Tai nghe" },
    { slug: "pin-sac", name: "Pin & Sạc" },
  ]},
  { slug: "thoi-trang-nam", name: "Thời trang nam", icon: "👕", subcategories: [
    { slug: "ao-somi", name: "Áo sơ mi" },
    { slug: "ao-thun", name: "Áo thun" },
    { slug: "quan-tay", name: "Quần tây" },
    { slug: "quan-jean", name: "Quần jean" },
    { slug: "giay-da", name: "Giày da" },
  ]},
  { slug: "thoi-trang-nu", name: "Thời trang nữ", icon: "👗", subcategories: [
    { slug: "do-mac-nha", name: "Đồ mặc nhà" },
    { slug: "do-tay-dao", name: "Đồ tây đảo" },
    { slug: "vay-dam", name: "Váy đầm" },
    { slug: "giay-sandal", name: "Giày sandal" },
    { slug: "tui-xach", name: "Túi xách" },
  ]},
  { slug: "dien-may", name: "Điện máy", icon: "📺", subcategories: [
    { slug: "lo-vi-song", name: "Lò vi sóng" },
    { slug: "ti-vi", name: "Ti vi" },
    { slug: "tu-lanh", name: "Tủ lạnh" },
    { slug: "may-giat", name: "Máy giặt" },
    { slug: "dieu-hoa", name: "Điều hòa" },
  ]},
  { slug: "nha-cua-doi-song", name: "Nhà cửa & Đời sống", icon: "🏠", subcategories: [
    { slug: "trang-tri-nha", name: "Trang trí nhà" },
    { slug: "do-dung-nha-bep", name: "Đồ dùng nhà bếp" },
    { slug: "do-ga-goi", name: "Đồ gá gối" },
    { slug: "den-soi", name: "Đèn soi" },
    { slug: "thiet-bi-phong-tam", name: "Thiết bị phòng tắm" },
  ]},
  { slug: "my-pham-lam-dep", name: "Mỹ phẩm & Làm đẹp", icon: "💄", subcategories: [
    { slug: "duong-da-mat", name: "Dưỡng da mặt" },
    { slug: "duong-toc", name: "Dưỡng tóc" },
    { slug: "makeup", name: "Makeup" },
    { slug: "nuoc-hoa", name: "Nước hoa" },
    { slug: "thuoc-nam", name: "Thuốc nằm" },
  ]},
  { slug: "me-be", name: "Mẹ & Bé", icon: "👶", subcategories: [
    { slug: "hang-em-be", name: "Hàng em bé" },
    { slug: "do-choi-tre-em", name: "Đồ chơi trẻ em" },
    { slug: "quan-ao-tre-em", name: "Quần áo trẻ em" },
    { slug: "sua-bot", name: "Sữa bột" },
    { slug: "tam-goi-em-be", name: "Tắm gội em bé" },
  ]},
  { slug: "the-thao-da-ngoai", name: "Thể thao & Dã ngoại", icon: "⛹️", subcategories: [
    { slug: "giay-the-thao", name: "Giày thể thao" },
    { slug: "ao-dong-phuc-the-thao", name: "Áo dòng phục thể thao" },
    { slug: "thiết-bi-the-thao", name: "Thiết bị thể thao" },
    { slug: "ba-lo-vali", name: "Ba lô & Vali" },
    { slug: "do-camping", name: "Đồ camping" },
  ]},
]

export const products = [
  { id: 1, name: "Điện thoại Samsung Galaxy A15", description: "Máy mới, bảo hành chính hãng 12 tháng", price: 4999000, originalPrice: 7990000, image: "/placeholder.svg", category: "Điện thoại", subcategory: "dien-thoai", vendor: "Samsung Việt Nam", vendorId: 1, rating: 4.8, reviews: 250, stock: 45, sold: 1250 },
  { id: 2, name: "Tai nghe Bluetooth Sony", description: "Âm thanh sắc nét, pin 30 giờ", price: 2499000, originalPrice: 4500000, image: "/placeholder.svg", category: "Tai nghe", subcategory: "tai-nghe", vendor: "Thế Giới Di Động", vendorId: 2, rating: 4.9, reviews: 580, stock: 120, sold: 3400 },
  { id: 3, name: "Áo thun cotton nam trắng", description: "Cotton 100%, thoáng mát", price: 299000, originalPrice: 599000, image: "/placeholder.svg", category: "Áo thun", subcategory: "ao-thun", vendor: "Uniqlo Việt Nam", vendorId: 5, rating: 4.6, reviews: 320, stock: 230, sold: 8900 },
  { id: 4, name: "Đồng hồ thông minh Apple Watch", description: "Theo dõi sức khỏe, nghe gọi", price: 8999000, originalPrice: 12999000, image: "/placeholder.svg", category: "Điện tử", subcategory: "dien-thoai", vendor: "Apple Store", vendorId: 4, rating: 4.9, reviews: 1250, stock: 67, sold: 5600 },
  { id: 5, name: "Bàn phím cơ gaming RGB", description: "Switch cơ, 8000Hz, đèn RGB", price: 1299000, originalPrice: 2199000, image: "/placeholder.svg", category: "Phụ kiện", subcategory: "tai-nghe", vendor: "Thế Giới Di Động", vendorId: 2, rating: 4.7, reviews: 210, stock: 34, sold: 1230 },
  { id: 6, name: "Quần jean nam Levi's", description: "Classic fit, cotton co giãn", price: 899000, originalPrice: 1599000, image: "/placeholder.svg", category: "Quần jean", subcategory: "quan-jean", vendor: "Zara Vietnam", vendorId: 6, rating: 4.5, reviews: 180, stock: 150, sold: 3200 },
  { id: 7, name: "Váy đầm nữ Zara", description: "Chất liệu linen thoáng mát", price: 1299000, originalPrice: 2499000, image: "/placeholder.svg", category: "Váy đầm", subcategory: "vay-dam", vendor: "Zara Vietnam", vendorId: 6, rating: 4.6, reviews: 290, stock: 89, sold: 2150 },
  { id: 8, name: "Tủ lạnh LG Inverter", description: "409 lít, tiết kiệm điện", price: 12999000, originalPrice: 18999000, image: "/placeholder.svg", category: "Tủ lạnh", subcategory: "tu-lanh", vendor: "Điện Máy Xanh", vendorId: 3, rating: 4.8, reviews: 420, stock: 12, sold: 340 },
  { id: 9, name: "Kem dưỡng da mặt Oriflame", description: "Chống lão hóa, se khít lỗ chân lông", price: 599000, originalPrice: 1099000, image: "/placeholder.svg", category: "Dưỡng da mặt", subcategory: "duong-da-mat", vendor: "Oriflame", vendorId: 7, rating: 4.4, reviews: 156, stock: 234, sold: 5600 },
  { id: 10, name: "Sữa bột Enfamil cho trẻ", description: "Từ 0-6 tháng tuổi", price: 399000, originalPrice: 599000, image: "/placeholder.svg", category: "Sữa bột", subcategory: "sua-bot", vendor: "Apple Store", vendorId: 4, rating: 4.7, reviews: 234, stock: 89, sold: 2340 },
  { id: 11, name: "Giày thể thao Nike", description: "Chạy bộ thoải mái, nhẹ", price: 1899000, originalPrice: 2999000, image: "/placeholder.svg", category: "Giày thể thao", subcategory: "giay-the-thao", vendor: "Elipsport", vendorId: 8, rating: 4.8, reviews: 678, stock: 156, sold: 7890 },
  { id: 12, name: "Máy tính bảng iPad Pro", description: "12.9 inch, M2, 256GB", price: 15999000, originalPrice: 21999000, image: "/placeholder.svg", category: "Máy tính bảng", subcategory: "may-tinh-bang", vendor: "Apple Store", vendorId: 4, rating: 4.9, reviews: 890, stock: 28, sold: 4500 },
  { id: 13, name: "Laptop Dell XPS 13", description: "Intel Core i7, 16GB RAM", price: 24999000, originalPrice: 34999000, image: "/placeholder.svg", category: "Máy tính xách tay", subcategory: "may-tinh-xach-tay", vendor: "Thế Giới Di Động", vendorId: 2, rating: 4.7, reviews: 450, stock: 18, sold: 890 },
  { id: 14, name: "Sạc pin 65W USB-C", description: "Sạc nhanh cho mọi thiết bị", price: 499000, originalPrice: 899000, image: "/placeholder.svg", category: "Pin & Sạc", subcategory: "pin-sac", vendor: "Samsung Việt Nam", vendorId: 1, rating: 4.6, reviews: 234, stock: 340, sold: 6700 },
  { id: 15, name: "Áo sơ mi nam trắng", description: "Cotton 100%, form chuẩn", price: 599000, originalPrice: 999000, image: "/placeholder.svg", category: "Áo sơ mi", subcategory: "ao-somi", vendor: "Uniqlo Việt Nam", vendorId: 5, rating: 4.5, reviews: 178, stock: 234, sold: 4560 },
  { id: 16, name: "Giày da nam công sở", description: "Da thật 100%, thoáng khí", price: 1299000, originalPrice: 1999000, image: "/placeholder.svg", category: "Giày da", subcategory: "giay-da", vendor: "Zara Vietnam", vendorId: 6, rating: 4.6, reviews: 267, stock: 120, sold: 2340 },
  { id: 17, name: "Lò vi sóng Panasonic", description: "1000W, 30 lít", price: 3499000, originalPrice: 5499000, image: "/placeholder.svg", category: "Lò vi sóng", subcategory: "lo-vi-song", vendor: "Điện Máy Xanh", vendorId: 3, rating: 4.7, reviews: 189, stock: 45, sold: 890 },
  { id: 18, name: "Ti vi Samsung 55 inch", description: "4K UHD, Smart TV", price: 9999000, originalPrice: 15999000, image: "/placeholder.svg", category: "Ti vi", subcategory: "ti-vi", vendor: "Samsung Việt Nam", vendorId: 1, rating: 4.8, reviews: 567, stock: 22, sold: 1200 },
  { id: 19, name: "Máy giặt LG AI DD", description: "10kg, tiết kiệm nước", price: 7999000, originalPrice: 11999000, image: "/placeholder.svg", category: "Máy giặt", subcategory: "may-giat", vendor: "Điện Máy Xanh", vendorId: 3, rating: 4.9, reviews: 678, stock: 15, sold: 450 },
  { id: 20, name: "Điều hòa Daikin Inverter", description: "1.5 HP, R32, tiết kiệm 40%", price: 8999000, originalPrice: 12999000, image: "/placeholder.svg", category: "Điều hòa", subcategory: "dieu-hoa", vendor: "Điện Máy Xanh", vendorId: 3, rating: 4.8, reviews: 456, stock: 12, sold: 380 },
]

export const orders = [
  { id: 1, orderNumber: "ORD20241201001", customer: "Nguyễn Văn A", status: "pending", total: 4999000, date: "2024-12-01", items: 1, paymentMethod: "COD" },
  { id: 2, orderNumber: "ORD20241130001", customer: "Trần Thị B", status: "shipping", total: 7499000, date: "2024-11-30", items: 3, paymentMethod: "Credit Card" },
  { id: 3, orderNumber: "ORD20241129001", customer: "Lê Minh C", status: "completed", total: 2999000, date: "2024-11-29", items: 2, paymentMethod: "Wallet" },
  { id: 4, orderNumber: "ORD20241128001", customer: "Phạm Thị D", status: "completed", total: 5499000, date: "2024-11-28", items: 4, paymentMethod: "COD" },
  { id: 5, orderNumber: "ORD20241127001", customer: "Võ Văn E", status: "cancelled", total: 1999000, date: "2024-11-27", items: 1, paymentMethod: "Credit Card" },
]

export const reviews = [
  { id: 1, productId: 1, customerName: "Nguyễn Hồng", rating: 5, comment: "Điện thoại rất tốt, pin lâu, camera sắc nét", date: "2024-11-28", verified: true },
  { id: 2, productId: 1, customerName: "Trần Anh", rating: 4, comment: "Giá hợp lý nhưng màn hình có lỗi nhẹ", date: "2024-11-25", verified: true },
  { id: 3, productId: 2, customerName: "Lê Minh", rating: 5, comment: "Tai nghe chất lượng âm thanh tuyệt vời", date: "2024-11-20", verified: true },
  { id: 4, productId: 3, customerName: "Phạm Hoa", rating: 4, comment: "Áo đẹp, nhưng vải hơi mỏng", date: "2024-11-18", verified: true },
]

export const customers = [
  { id: 1, name: "Nguyễn Văn A", email: "nguyenvana@email.com", phone: "0901234567", status: "active", joinDate: "2024-01-15", orders: 12, totalSpent: 45999000 },
  { id: 2, name: "Trần Thị B", email: "tranthib@email.com", phone: "0902345678", status: "active", joinDate: "2024-02-20", orders: 8, totalSpent: 32999000 },
  { id: 3, name: "Lê Minh C", email: "leminch@email.com", phone: "0903456789", status: "suspended", joinDate: "2024-03-10", orders: 3, totalSpent: 9999000 },
]

export const banners = [
  { id: 1, title: "Flash Sale Điện thoại", image: "/placeholder.svg", link: "/category/dien-tu?sub=dien-thoai", discount: "Giảm tới 40%", startDate: "2024-12-01", endDate: "2024-12-05" },
  { id: 2, title: "Thời trang mùa đông", image: "/placeholder.svg", link: "/category/thoi-trang-nam", discount: "Mua 2 tặng 1", startDate: "2024-12-01", endDate: "2024-12-15" },
  { id: 3, title: "Ưu đãi Điện máy", image: "/placeholder.svg", link: "/category/dien-may", discount: "Trả góp 0%", startDate: "2024-12-01", endDate: "2024-12-31" },
]

export const promotions = [
  { id: 1, title: "Flash Sale Tháng 12", description: "Giảm tới 50% cho các sản phẩm được chọn", startDate: "2024-12-01", endDate: "2024-12-10", discount: 50, type: "flash_sale", status: "active" },
  { id: 2, title: "Mua 2 tặng 1 Thời trang", description: "Khuyến mãi trên toàn bộ áo, quần", startDate: "2024-12-05", endDate: "2024-12-20", discount: 33, type: "promotion", status: "pending" },
  { id: 3, title: "Trả góp 0% Điện máy", description: "Mua điện máy được trả góp 12 tháng không lãi", startDate: "2024-12-01", endDate: "2024-12-31", discount: 0, type: "promotion", status: "active" },
]

export const shops = [
  { id: 1, name: "Samsung Việt Nam", vendorId: 1, image: "/placeholder.svg", description: "Cửa hàng chính thức Samsung tại Việt Nam", followers: 5420, verified: true, rating: 4.8, reviews: 1250 },
  { id: 2, name: "Thế Giới Di Động", vendorId: 2, image: "/placeholder.svg", description: "Chuỗi bán lẻ điện thoại lớn nhất Việt Nam", followers: 98765, verified: true, rating: 4.7, reviews: 8900 },
  { id: 3, name: "Apple Store", vendorId: 4, image: "/placeholder.svg", description: "Cửa hàng chính hãng Apple", followers: 156000, verified: true, rating: 4.9, reviews: 5600 },
]

export const jobs = [
  { id: 1, title: "Lập trình viên Full Stack", company: "Sàn TMĐT APECSPACE", location: "Hà Nội", salary: "15-20 triệu", type: "full-time", description: "Tuyển lập trình viên fullstack có kinh nghiệm React, Node.js", requirements: ["3+ năm kinh nghiệm", "Thành thạo React, Node.js", "Có kinh nghiệm làm việc với cơ sở dữ liệu"] },
  { id: 2, title: "UX/UI Designer", company: "Sàn TMĐT APECSPACE", location: "TP.HCM", salary: "12-18 triệu", type: "full-time", description: "Thiết kế giao diện người dùng cho ứng dụng web/mobile", requirements: ["2+ năm kinh nghiệm", "Thành thạo Figma, Adobe XD", "Hiểu biết về UX/UI"] },
  { id: 3, title: "Chuyên viên Marketing", company: "Sàn TMĐT APECSPACE", location: "Hà Nội", salary: "10-15 triệu", type: "full-time", description: "Quản lý chiến dịch marketing digital", requirements: ["1+ năm kinh nghiệm", "Kỹ năng digital marketing", "Thành thạo social media"] },
]

export const adminPendingVendors = [
  {
    id: 1,
    shopName: "Samsung Việt Nam",
    ownerName: "Nguyễn Văn A",
    email: "contact@samsung-vn.vn",
    phone: "0981234567",
    taxId: "0123456789",
    submittedDate: "2025-01-15",
    status: "pending",
    documents: {
      idCard: "uploaded",
      businessLicense: "uploaded",
      bankStatement: "uploaded",
    },
  },
  {
    id: 2,
    shopName: "Apple Store Hà Nội",
    ownerName: "Trần Thị B",
    email: "hano@applestore.vn",
    phone: "0912345678",
    taxId: "0987654321",
    submittedDate: "2025-01-14",
    status: "pending",
    documents: {
      idCard: "uploaded",
      businessLicense: "uploaded",
      bankStatement: "pending",
    },
  },
  {
    id: 3,
    shopName: "Tech Store 365",
    ownerName: "Phạm Tuấn Minh",
    email: "contact@techstore365.vn",
    phone: "0933456789",
    taxId: "0111222333",
    submittedDate: "2025-01-12",
    status: "pending",
    documents: {
      idCard: "uploaded",
      businessLicense: "uploaded",
      bankStatement: "uploaded",
    },
  },
]

export const adminApprovedVendors = [
  {
    id: 4,
    shopName: "Sony Việt Nam",
    ownerName: "Phạm Công C",
    email: "contact@sony-vn.vn",
    phone: "0941234567",
    status: "approved",
    approvedDate: "2025-01-10",
    products: 450,
    commission: "5%",
    totalRevenue: 250000000,
  },
  {
    id: 5,
    shopName: "LG Electronics",
    ownerName: "Lê Đức D",
    email: "contact@lg-vn.vn",
    phone: "0951234567",
    status: "approved",
    approvedDate: "2025-01-05",
    products: 320,
    commission: "5%",
    totalRevenue: 180000000,
  },
  {
    id: 6,
    shopName: "Canon Store",
    ownerName: "Võ Thị E",
    email: "contact@canon-vn.vn",
    phone: "0961234567",
    status: "approved",
    approvedDate: "2024-12-20",
    products: 280,
    commission: "6%",
    totalRevenue: 150000000,
  },
]

export const adminRejectedVendors = [
  {
    id: 7,
    shopName: "Unknown Shop",
    ownerName: "Võ Văn E",
    email: "unknown@shop.vn",
    phone: "0971234567",
    status: "rejected",
    rejectionReason: "Tài liệu không hợp lệ",
    rejectedDate: "2025-01-08",
  },
  {
    id: 8,
    shopName: "Mystery Store",
    ownerName: "Ngô Thị F",
    email: "mystery@store.vn",
    phone: "0981111111",
    status: "rejected",
    rejectionReason: "Không thỏa điều kiện kinh doanh",
    rejectedDate: "2025-01-07",
  },
]

export const sellerStatistics = {
  shopName: "Samsung Việt Nam",
  shopId: 1,
  revenue: 125450000,
  revenueLastMonth: 98750000,
  orders: 1250,
  ordersThisMonth: 420,
  ordersToday: 12,
  products: 850,
  activeProducts: 750,
  ratings: 4.9,
  followers: 450000,
  commission: "5%",
}

export const sellerMonthlyData = [
  { month: "Jan", revenue: 45000000, orders: 300, refunds: 2000000 },
  { month: "Feb", revenue: 52000000, orders: 350, refunds: 2500000 },
  { month: "Mar", revenue: 48000000, orders: 320, refunds: 1800000 },
  { month: "Apr", revenue: 61000000, orders: 410, refunds: 3000000 },
  { month: "May", revenue: 98750000, orders: 580, refunds: 5000000 },
  { month: "Jun", revenue: 125450000, orders: 650, refunds: 6000000 },
]

export const sellerRecentOrders = [
  {
    id: "ORD001",
    buyer: "Nguyễn Văn A",
    buyerPhone: "0901234567",
    products: "Điện thoại Samsung Galaxy A15",
    amount: 4999000,
    status: "Delivered",
    date: "2025-01-15",
    paymentMethod: "COD",
  },
  {
    id: "ORD002",
    buyer: "Trần Thị B",
    buyerPhone: "0902345678",
    products: "Tai nghe Bluetooth",
    amount: 999000,
    status: "Processing",
    date: "2025-01-14",
    paymentMethod: "Credit Card",
  },
  {
    id: "ORD003",
    buyer: "Phạm Công C",
    buyerPhone: "0903456789",
    products: "Laptop ASUS VivoBook",
    amount: 18990000,
    status: "Pending",
    date: "2025-01-13",
    paymentMethod: "Wallet",
  },
  {
    id: "ORD004",
    buyer: "Lê Minh D",
    buyerPhone: "0904567890",
    products: "iPad Pro 12.9",
    amount: 15999000,
    status: "Shipped",
    date: "2025-01-12",
    paymentMethod: "COD",
  },
  {
    id: "ORD005",
    buyer: "Ngô Thị E",
    buyerPhone: "0905678901",
    products: "Apple Watch Series 8",
    amount: 8999000,
    status: "Delivered",
    date: "2025-01-11",
    paymentMethod: "Credit Card",
  },
]

export const sellerTopProducts = [
  {
    id: 1,
    name: "Điện thoại Samsung Galaxy A15",
    category: "Điện thoại",
    sales: 450,
    revenue: 2249550000,
    stock: 45,
    rating: 4.8,
  },
  {
    id: 2,
    name: "Tai nghe Bluetooth",
    category: "Tai nghe",
    sales: 320,
    revenue: 319680000,
    stock: 120,
    rating: 4.9,
  },
  {
    id: 3,
    name: "Laptop ASUS VivoBook",
    category: "Máy tính xách tay",
    sales: 85,
    revenue: 1614150000,
    stock: 18,
    rating: 4.7,
  },
  {
    id: 4,
    name: "Đồng hồ thông minh Apple Watch",
    category: "Đồng hồ",
    sales: 200,
    revenue: 1799800000,
    stock: 67,
    rating: 4.9,
  },
]

export const sellerWalletData = {
  balance: 125450000,
  totalEarnings: 1254500000,
  totalWithdrawals: 1129050000,
  pendingWithdrawal: 0,
  commission: 62725000,
  refunds: 21000000,
}

export const sellerWithdrawHistory = [
  { id: 1, amount: 50000000, date: "2025-01-10", status: "completed", bankAccount: "0901234567" },
  { id: 2, amount: 45000000, date: "2025-01-05", status: "completed", bankAccount: "0901234567" },
  { id: 3, amount: 60000000, date: "2024-12-28", status: "completed", bankAccount: "0901234567" },
  { id: 4, amount: 30000000, date: "2024-12-20", status: "pending", bankAccount: "0901234567" },
]

export const sellerProductReviews = [
  {
    id: 1,
    productId: 1,
    customerName: "Nguyễn Hồng",
    rating: 5,
    comment: "Điện thoại rất tốt, pin lâu, camera sắc nét",
    date: "2024-11-28",
    verified: true,
  },
  {
    id: 2,
    productId: 1,
    customerName: "Trần Anh",
    rating: 4,
    comment: "Giá hợp lý nhưng màn hình có lỗi nhẹ",
    date: "2024-11-25",
    verified: true,
  },
  {
    id: 3,
    productId: 2,
    customerName: "Lê Minh",
    rating: 5,
    comment: "Tai nghe chất lượng âm thanh tuyệt vời",
    date: "2024-11-20",
    verified: true,
  },
  {
    id: 4,
    productId: 3,
    customerName: "Phạm Hoa",
    rating: 4,
    comment: "Laptop xử lý tốt nhưng pin không lâu",
    date: "2024-11-18",
    verified: true,
  },
]

export const clientCartItems = [
  {
    id: 1,
    name: "Điện thoại Samsung Galaxy A15",
    price: 4999000,
    originalPrice: 7990000,
    image: "/placeholder.svg?key=a9fn7",
    quantity: 1,
    seller: "Samsung Việt Nam",
    sellerId: 1,
  },
  {
    id: 2,
    name: "Tai nghe Bluetooth",
    price: 499000,
    originalPrice: 1200000,
    image: "/placeholder.svg?key=klle7",
    quantity: 2,
    seller: "Thế Giới Di Động",
    sellerId: 2,
  },
  {
    id: 3,
    name: "Áo thun cotton nam trắng",
    price: 299000,
    originalPrice: 599000,
    image: "/placeholder.svg?key=shirt1",
    quantity: 1,
    seller: "Uniqlo Việt Nam",
    sellerId: 5,
  },
]

export const clientFavorites = [
  { id: 1, ...products[0] },
  { id: 4, ...products[3] },
  { id: 7, ...products[6] },
  { id: 11, ...products[10] },
]

export const clientOrderHistory = [
  {
    id: 1,
    orderNumber: "ORD20241201001",
    date: "2024-12-01",
    status: "completed",
    total: 4999000,
    items: 1,
    paymentMethod: "COD",
    estimatedDelivery: "2024-12-05",
  },
  {
    id: 2,
    orderNumber: "ORD20241130001",
    date: "2024-11-30",
    status: "completed",
    total: 7499000,
    items: 3,
    paymentMethod: "Credit Card",
    estimatedDelivery: "2024-12-04",
  },
  {
    id: 3,
    orderNumber: "ORD20241129001",
    date: "2024-11-29",
    status: "completed",
    total: 2999000,
    items: 2,
    paymentMethod: "Wallet",
    estimatedDelivery: "2024-12-03",
  },
  {
    id: 4,
    orderNumber: "ORD20241128001",
    date: "2024-11-28",
    status: "cancelled",
    total: 5499000,
    items: 4,
    paymentMethod: "COD",
    cancellationReason: "Người dùng huỷ",
  },
]

export const clientUserProfile = {
  id: 1,
  name: "Nguyễn Văn A",
  email: "nguyenvana@email.com",
  phone: "0901234567",
  status: "active",
  joinDate: "2024-01-15",
  orders: 12,
  totalSpent: 45999000,
  addresses: [
    {
      id: 1,
      label: "Nhà riêng",
      street: "123 Đường Lê Lợi",
      ward: "Bến Nghé",
      district: "Quận 1",
      city: "TP. Hồ Chí Minh",
      postalCode: "700000",
      isDefault: true,
    },
    {
      id: 2,
      label: "Văn phòng",
      street: "456 Đường Trần Hưng Đạo",
      ward: "Tân Định",
      district: "Quận 1",
      city: "TP. Hồ Chí Minh",
      postalCode: "700000",
      isDefault: false,
    },
  ],
}

export const clientShopDetails = [
  {
    id: 1,
    shopName: "Samsung Việt Nam",
    vendorId: 1,
    image: "/placeholder.svg",
    description: "Cửa hàng chính thức Samsung tại Việt Nam",
    followers: 5420,
    verified: true,
    rating: 4.8,
    reviews: 1250,
    responseTime: "2 giờ",
    returnRate: "0.5%",
    productsCount: 145,
    followers_joined: "Tháng 01/2024",
  },
  {
    id: 2,
    shopName: "Thế Giới Di Động",
    vendorId: 2,
    image: "/placeholder.svg",
    description: "Chuỗi bán lẻ điện thoại lớn nhất Việt Nam",
    followers: 98765,
    verified: true,
    rating: 4.7,
    reviews: 8900,
    responseTime: "1 giờ",
    returnRate: "0.8%",
    productsCount: 2340,
    followers_joined: "Tháng 02/2024",
  },
  {
    id: 3,
    shopName: "Apple Store",
    vendorId: 4,
    image: "/placeholder.svg",
    description: "Cửa hàng chính hãng Apple",
    followers: 156000,
    verified: true,
    rating: 4.9,
    reviews: 5600,
    responseTime: "30 phút",
    returnRate: "0.3%",
    productsCount: 320,
    followers_joined: "Tháng 03/2024",
  },
]

export const clientSearchHistory = [
  "Samsung Galaxy A15",
  "Tai nghe Bluetooth",
  "Laptop gaming",
  "Áo thun nam",
  "Điều hòa daikin",
]

export const clientNotifications = [
  {
    id: 1,
    type: "order",
    title: "Đơn hàng ORD20241201001 đã được giao",
    message: "Cảm ơn bạn đã mua sắm. Kiểm tra chi tiết đơn hàng",
    date: "2024-12-05",
    read: true,
  },
  {
    id: 2,
    type: "promotion",
    title: "Flash Sale điện thoại - Giảm tới 40%",
    message: "Sản phẩm yêu thích của bạn đang được giảm giá",
    date: "2024-12-04",
    read: false,
  },
  {
    id: 3,
    type: "review",
    title: "Hãy đánh giá sản phẩm",
    message: "Chia sẻ cảm nhận của bạn về Điện thoại Samsung Galaxy A15",
    date: "2024-12-03",
    read: false,
  },
]

export const adminDashboardStats = {
  totalVendors: 8,
  pendingVendors: 3,
  approvedVendors: 3,
  rejectedVendors: 2,
  totalProducts: 20,
  totalOrders: 100,
  totalRevenue: 5000000000,
  totalUsers: 3,
  totalRefunds: 50000000,
}

export const adminReports = [
  {
    id: 1,
    type: "Sales",
    period: "January 2025",
    revenue: 250000000,
    orders: 1200,
    refunds: 5000000,
    generatedDate: "2025-01-31",
  },
  {
    id: 2,
    type: "Vendor Performance",
    period: "January 2025",
    topVendor: "Samsung Việt Nam",
    topVendorRevenue: 125450000,
    generatedDate: "2025-01-31",
  },
  {
    id: 3,
    type: "Customer Analytics",
    period: "January 2025",
    newCustomers: 250,
    activeCustomers: 1500,
    churnRate: "5%",
    generatedDate: "2025-01-31",
  },
]

export const adminSettings = {
  platformName: "APECTECH Marketplace",
  platformEmail: "support@apectech.vn",
  platformPhone: "1800-1111",
  commission: "5%",
  currency: "VND",
  minWithdrawal: 100000,
  maxWithdrawal: 1000000000,
  vendorVerificationRequired: true,
  autoApproveProducts: false,
  maintenanceMode: false,
}

export const adminCategories = [
  { id: 1, name: "Thời trang", icon: "👕", status: "active", productCount: 1200 },
  { id: 2, name: "Điện tử", icon: "📱", status: "active", productCount: 2400 },
  { id: 3, name: "Nhà cửa & đời sống", icon: "🏠", status: "active", productCount: 800 },
  { id: 4, name: "Sức khỏe & sắc đẹp", icon: "💄", status: "active", productCount: 600 },
  { id: 5, name: "Mẹ & bé", icon: "👶", status: "active", productCount: 400 },
  { id: 6, name: "Thể thao & dã ngoại", icon: "⛹️", status: "active", productCount: 500 },
]

export const adminWithdrawRequests = [
  {
    id: 1,
    vendorName: "Samsung Việt Nam",
    amount: 50000000,
    bankAccount: "0123456789",
    bankName: "Vietcombank",
    requestDate: "2025-01-15",
    status: "pending",
  },
  {
    id: 2,
    vendorName: "Thế Giới Di Động",
    amount: 35000000,
    bankAccount: "0987654321",
    bankName: "Techcombank",
    requestDate: "2025-01-14",
    status: "approved",
  },
  {
    id: 3,
    vendorName: "Apple Store",
    amount: 60000000,
    bankAccount: "0111222333",
    bankName: "BIDV",
    requestDate: "2025-01-13",
    status: "completed",
  },
]

export const adminBanners = [
  {
    id: 1,
    title: "Flash Sale Điện thoại",
    image: "/placeholder.svg",
    link: "/category/dien-tu?sub=dien-thoai",
    discount: "Giảm tới 40%",
    startDate: "2024-12-01",
    endDate: "2024-12-05",
    status: "active",
  },
  {
    id: 2,
    title: "Thời trang mùa đông",
    image: "/placeholder.svg",
    link: "/category/thoi-trang-nam",
    discount: "Mua 2 tặng 1",
    startDate: "2024-12-01",
    endDate: "2024-12-15",
    status: "active",
  },
  {
    id: 3,
    title: "Ưu đãi Điện máy",
    image: "/placeholder.svg",
    link: "/category/dien-may",
    discount: "Trả góp 0%",
    startDate: "2024-12-01",
    endDate: "2024-12-31",
    status: "scheduled",
  },
]

export const adminPromotions = [
  {
    id: 1,
    title: "Flash Sale Tháng 12",
    description: "Giảm tới 50% cho các sản phẩm được chọn",
    startDate: "2024-12-01",
    endDate: "2024-12-10",
    discount: 50,
    type: "flash_sale",
    status: "active",
    budget: 500000000,
  },
  {
    id: 2,
    title: "Mua 2 tặng 1 Thời trang",
    description: "Khuyến mãi trên toàn bộ áo, quần",
    startDate: "2024-12-05",
    endDate: "2024-12-20",
    discount: 33,
    type: "promotion",
    status: "pending",
    budget: 300000000,
  },
  {
    id: 3,
    title: "Trả góp 0% Điện máy",
    description: "Mua điện máy được trả góp 12 tháng không lãi",
    startDate: "2024-12-01",
    endDate: "2024-12-31",
    discount: 0,
    type: "promotion",
    status: "active",
    budget: 200000000,
  },
]

export const adminOrderManagement = [
  {
    id: 1,
    orderNumber: "ORD20241201001",
    customer: "Nguyễn Văn A",
    vendor: "Samsung Việt Nam",
    total: 4999000,
    date: "2024-12-01",
    status: "completed",
    items: 1,
    paymentMethod: "COD",
    shippingAddress: "123 Đường Lê Lợi, Quận 1, TP.HCM",
  },
  {
    id: 2,
    orderNumber: "ORD20241130001",
    customer: "Trần Thị B",
    vendor: "Thế Giới Di Động",
    total: 7499000,
    date: "2024-11-30",
    status: "shipping",
    items: 3,
    paymentMethod: "Credit Card",
    shippingAddress: "456 Đường Trần Hưng Đạo, Quận 1, TP.HCM",
  },
  {
    id: 3,
    orderNumber: "ORD20241129001",
    customer: "Lê Minh C",
    vendor: "Apple Store",
    total: 2999000,
    date: "2024-11-29",
    status: "completed",
    items: 2,
    paymentMethod: "Wallet",
    shippingAddress: "789 Đường Nguyễn Huệ, Quận 1, TP.HCM",
  },
]

export const adminUserManagement = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    phone: "0901234567",
    status: "active",
    joinDate: "2024-01-15",
    orders: 12,
    totalSpent: 45999000,
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "tranthib@email.com",
    phone: "0902345678",
    status: "active",
    joinDate: "2024-02-20",
    orders: 8,
    totalSpent: 32999000,
  },
  {
    id: 3,
    name: "Lê Minh C",
    email: "leminch@email.com",
    phone: "0903456789",
    status: "suspended",
    joinDate: "2024-03-10",
    orders: 3,
    totalSpent: 9999000,
  },
]

export const sellerChatMessages = [
  {
    id: 1,
    customerId: 1,
    customerName: "Nguyễn Văn A",
    message: "Điện thoại còn hàng không ạ?",
    timestamp: "2025-01-15 10:30",
    status: "unread",
    attachments: [],
  },
  {
    id: 2,
    customerId: 2,
    customerName: "Trần Thị B",
    message: "Giao được không? Mình đang gấp",
    timestamp: "2025-01-15 09:15",
    status: "read",
    attachments: [],
  },
  {
    id: 3,
    customerId: 3,
    customerName: "Phạm Công C",
    message: "Hàng có bảo hành không ạ?",
    timestamp: "2025-01-14 14:45",
    status: "read",
    attachments: [],
  },
]

export const sellerGuides = [
  {
    id: 1,
    title: "Cách đăng ký cửa hàng trên sàn",
    category: "Getting Started",
    content: "Hướng dẫn chi tiết cách đăng ký cửa hàng...",
    viewCount: 1250,
  },
  {
    id: 2,
    title: "Cách thêm sản phẩm mới",
    category: "Products",
    content: "Hướng dẫn cách tạo và quản lý sản phẩm...",
    viewCount: 3420,
  },
  {
    id: 3,
    title: "Chính sách vận chuyển",
    category: "Shipping",
    content: "Thông tin chi tiết về vận chuyển và giao hàng...",
    viewCount: 2100,
  },
  {
    id: 4,
    title: "Cách rút tiền từ ví",
    category: "Payment",
    content: "Hướng dẫn rút tiền từ tài khoản ví của bạn...",
    viewCount: 4560,
  },
]

export const sellerSettings = {
  shopName: "Samsung Việt Nam",
  shopId: 1,
  ownerName: "Nguyễn Văn A",
  email: "contact@samsung-vn.vn",
  phone: "0981234567",
  address: "123 Đường A, Quận 1, TP.HCM",
  bankAccount: "0123456789",
  bankName: "Vietcombank",
  bankBranch: "TP. Hồ Chí Minh",
  enableNotifications: true,
  enableAutoReply: true,
  autoReplyMessage: "Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong 2 giờ.",
  businessHours: "08:00 - 22:00",
}

export const sellerProfile = {
  shopId: 1,
  shopName: "Samsung Việt Nam",
  ownerName: "Nguyễn Văn A",
  email: "contact@samsung-vn.vn",
  phone: "0981234567",
  address: "123 Đường A, Quận 1, TP.HCM",
  taxId: "0123456789",
  businessLicense: "1234567890",
  avatar: "/placeholder.svg",
  cover: "/placeholder.svg",
  description: "Cửa hàng chính thức Samsung tại Việt Nam",
  establishedDate: "2024-01-15",
  followers: 450000,
  rating: 4.9,
  responseRate: "98%",
  shippingTime: "1-2 ngày",
  verified: true,
}

export const clientCheckoutData = {
  shippingMethods: [
    { id: 1, name: "Giao hàng tiêu chuẩn", price: 30000, estimatedDays: "3-5 ngày" },
    { id: 2, name: "Giao hàng nhanh", price: 50000, estimatedDays: "1-2 ngày" },
    { id: 3, name: "Giao hàng siêu tốc", price: 100000, estimatedDays: "Cùng ngày" },
  ],
  paymentMethods: [
    { id: 1, name: "Thanh toán khi nhận hàng (COD)", enabled: true },
    { id: 2, name: "Thẻ tín dụng/Ghi nợ", enabled: true },
    { id: 3, name: "Ví điện tử", enabled: true },
    { id: 4, name: "Chuyển khoản ngân hàng", enabled: true },
  ],
  availableCoupons: [
    { id: 1, code: "WELCOME10", discount: "10%", minOrder: 100000, maxUses: 1000 },
    { id: 2, code: "NEWYEAR20", discount: "20%", minOrder: 500000, maxUses: 500 },
    { id: 3, code: "FREESHIP", discount: "Miễn phí vận chuyển", minOrder: 200000, maxUses: 2000 },
  ],
}

export const clientProductPage = {
  product: {
    id: 1,
    name: "Điện thoại Samsung Galaxy A15",
    price: 4999000,
    originalPrice: 7990000,
    discount: "37%",
    rating: 4.8,
    reviews: 250,
    stock: 45,
    sold: 1250,
    category: "Điện thoại",
    subcategory: "dien-thoai",
    vendor: "Samsung Việt Nam",
    vendorId: 1,
    vendorRating: 4.8,
    description: "Máy mới, bảo hành chính hãng 12 tháng",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    specifications: {
      display: "OLED 6.1 inch",
      processor: "Snapdragon 8 Gen 2",
      ram: "8GB",
      storage: "256GB",
      camera: "50MP + 12MP",
      battery: "4000mAh",
      os: "Android 14",
    },
    shippingInfo: {
      freeShipping: true,
      estimatedDays: "1-2 ngày",
      from: "TP. Hồ Chí Minh",
    },
    warranty: "12 tháng bảo hành chính hãng",
  },
  relatedProducts: products.slice(0, 5),
}

export const clientSearchResults = {
  query: "Samsung Galaxy A15",
  totalResults: 145,
  filters: {
    categories: ["Điện thoại", "Điện tử"],
    priceRange: { min: 0, max: 10000000 },
    rating: { min: 0, max: 5 },
    vendors: ["Samsung Việt Nam", "Thế Giới Di Động"],
  },
  results: products.slice(0, 8),
  appliedFilters: [],
}
