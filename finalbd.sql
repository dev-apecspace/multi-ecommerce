-- ============================================================================
-- E-Commerce Marketplace Database Schema
-- ============================================================================
-- Base schema with all tables and indexes
-- Run this complete script in Supabase SQL Editor to set up the database

-- ============================================================================
-- User Management Tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS "User" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  "joinDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  orders INT DEFAULT 0,
  "totalSpent" FLOAT DEFAULT 0,
  role VARCHAR(50) DEFAULT 'customer',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "UserProfile" (
  id SERIAL PRIMARY KEY,
  "userId" INT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  avatar VARCHAR(255),
  "vendorLogo" VARCHAR(255),
  "joinDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "UserProfile" ("userId", "createdAt", "updatedAt")
  VALUES (NEW.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profile_trigger
AFTER INSERT ON "User"
FOR EACH ROW
EXECUTE FUNCTION create_user_profile();

CREATE TABLE IF NOT EXISTS "Address" (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  label VARCHAR(255) DEFAULT 'Địa chỉ',
  street VARCHAR(255) NOT NULL,
  ward VARCHAR(255) NOT NULL,
  district VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  "postalCode" VARCHAR(20),
  "fullName" VARCHAR(255),
  "phone" VARCHAR(20),
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_address_userId ON "Address"("userId");

-- ============================================================================
-- Vendor & Shop Management Tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Vendor" (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  "joinDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rating FLOAT DEFAULT 0,
  products INT DEFAULT 0,
  followers INT DEFAULT 0,
  "vendorLogo" VARCHAR(255),
  "businessType" VARCHAR(255),
  "taxId" VARCHAR(255),
  "businessLicense" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_userId ON "Vendor"("userId");
CREATE INDEX IF NOT EXISTS idx_vendor_slug ON "Vendor"("slug");

CREATE TABLE IF NOT EXISTS "Shop" (
  id SERIAL PRIMARY KEY,
  "vendorId" INT UNIQUE NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  name VARCHAR(255) UNIQUE NOT NULL,
  image VARCHAR(255),
  description TEXT,
  followers INT DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  rating FLOAT DEFAULT 0,
  reviews INT DEFAULT 0,
  "responseTime" VARCHAR(50) DEFAULT '2 giờ',
  "returnRate" VARCHAR(20) DEFAULT '0%',
  "productsCount" INT DEFAULT 0,
  "locked" BOOLEAN DEFAULT false,
  "joinDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ShopDetail" (
  id SERIAL PRIMARY KEY,
  "shopId" INT UNIQUE NOT NULL REFERENCES "Shop"(id) ON DELETE CASCADE,
  "ownerName" VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address VARCHAR(255),
  "taxId" VARCHAR(255),
  "businessLicense" VARCHAR(255),
  "bankAccount" VARCHAR(255),
  "bankName" VARCHAR(255),
  "bankBranch" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "VendorDocument" (
  id SERIAL PRIMARY KEY,
  "vendorId" INT NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  "documentType" VARCHAR(255) NOT NULL,
  "documentName" VARCHAR(255) NOT NULL,
  "documentUrl" VARCHAR(255) NOT NULL,
  "status" VARCHAR(50) DEFAULT 'pending',
  "reviewNotes" TEXT,
  "reviewedBy" INT REFERENCES "User"(id) ON DELETE SET NULL,
  "reviewedAt" TIMESTAMP,
  "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendordocument_vendorId ON "VendorDocument"("vendorId");
CREATE INDEX IF NOT EXISTS idx_vendordocument_status ON "VendorDocument"("status");

-- ============================================================================
-- Product Management Tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Category" (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SubCategory" (
  id SERIAL PRIMARY KEY,
  "categoryId" INT NOT NULL REFERENCES "Category"(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subcategory_categoryId ON "SubCategory"("categoryId");

CREATE TABLE IF NOT EXISTS "Product" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  price FLOAT NOT NULL,
  "originalPrice" FLOAT,
  image VARCHAR(255),
  "categoryId" INT NOT NULL REFERENCES "Category"(id) ON DELETE CASCADE,
  "subcategoryId" INT NOT NULL REFERENCES "SubCategory"(id) ON DELETE CASCADE,
  "vendorId" INT NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  rating FLOAT DEFAULT 0,
  reviews INT DEFAULT 0,
  stock INT DEFAULT 0,
  sold INT DEFAULT 0,
  specifications TEXT,
  "shippingInfo" TEXT,
  warranty VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_categoryId ON "Product"("categoryId");
CREATE INDEX IF NOT EXISTS idx_product_subcategoryId ON "Product"("subcategoryId");
CREATE INDEX IF NOT EXISTS idx_product_vendorId ON "Product"("vendorId");
CREATE INDEX IF NOT EXISTS idx_product_status ON "Product"("status");
CREATE INDEX IF NOT EXISTS idx_product_slug ON "Product"("slug");

CREATE TABLE IF NOT EXISTS "ProductImage" (
  id SERIAL PRIMARY KEY,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "imageUrl" VARCHAR(255) NOT NULL,
  "displayOrder" INT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productimage_productId ON "ProductImage"("productId");

CREATE TABLE IF NOT EXISTS "ProductVariant" (
  id SERIAL PRIMARY KEY,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  name VARCHAR(255),
  sku VARCHAR(255) UNIQUE,
  barcode VARCHAR(255),
  price FLOAT,
  "originalPrice" FLOAT,
  stock INT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productvariant_productId ON "ProductVariant"("productId");
CREATE INDEX IF NOT EXISTS idx_productvariant_sku ON "ProductVariant"("sku");

CREATE TABLE IF NOT EXISTS "ProductAttribute" (
  id SERIAL PRIMARY KEY,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productattribute_productId ON "ProductAttribute"("productId");

CREATE TABLE IF NOT EXISTS "ProductAttributeValue" (
  id SERIAL PRIMARY KEY,
  "attributeId" INT NOT NULL REFERENCES "ProductAttribute"(id) ON DELETE CASCADE,
  value VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productattributevalue_attributeId ON "ProductAttributeValue"("attributeId");

-- ============================================================================
-- Shopping & Orders Tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS "CartItem" (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "variantId" INT REFERENCES "ProductVariant"(id) ON DELETE SET NULL,
  quantity INT DEFAULT 1,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "productId", "variantId")
);

CREATE INDEX IF NOT EXISTS idx_cartitem_userId ON "CartItem"("userId");
CREATE INDEX IF NOT EXISTS idx_cartitem_productId ON "CartItem"("productId");

CREATE TABLE IF NOT EXISTS "Favorite" (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "productId")
);

CREATE INDEX IF NOT EXISTS idx_favorite_userId ON "Favorite"("userId");
CREATE INDEX IF NOT EXISTS idx_favorite_productId ON "Favorite"("productId");

CREATE TABLE IF NOT EXISTS "Order" (
  id SERIAL PRIMARY KEY,
  "orderNumber" VARCHAR(255) UNIQUE NOT NULL,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "vendorId" INT NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  total FLOAT NOT NULL,
  "shippingCost" FLOAT DEFAULT 0,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "paymentMethod" VARCHAR(100),
  "shippingAddress" TEXT,
  "estimatedDelivery" TIMESTAMP,
  "cancellationReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_userId ON "Order"("userId");
CREATE INDEX IF NOT EXISTS idx_order_vendorId ON "Order"("vendorId");
CREATE INDEX IF NOT EXISTS idx_order_vendorId_status ON "Order"("vendorId", "status");

CREATE TABLE IF NOT EXISTS "OrderItem" (
  id SERIAL PRIMARY KEY,
  "orderId" INT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "variantId" INT REFERENCES "ProductVariant"(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  price FLOAT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orderitem_orderId ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS idx_orderitem_productId ON "OrderItem"("productId");

-- ============================================================================
-- Review Tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Review" (
  id SERIAL PRIMARY KEY,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "customerId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "customerName" VARCHAR(255) NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_productId ON "Review"("productId");
CREATE INDEX IF NOT EXISTS idx_review_customerId ON "Review"("customerId");

CREATE TABLE IF NOT EXISTS "VendorReview" (
  id SERIAL PRIMARY KEY,
  "vendorId" INT NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  rating INT NOT NULL,
  comment TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendorreview_vendorId ON "VendorReview"("vendorId");

-- ============================================================================
-- Seller Features Tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Banner" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image VARCHAR(255),
  link VARCHAR(255),
  discount VARCHAR(50),
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Promotion" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  discount INT DEFAULT 0,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  budget FLOAT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SellerChat" (
  id SERIAL PRIMARY KEY,
  "vendorId" INT NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  "customerName" VARCHAR(255) NOT NULL,
  "customerId" INT,
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'unread',
  attachments TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sellerchat_vendorId ON "SellerChat"("vendorId");

CREATE TABLE IF NOT EXISTS "SellerGuide" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  content TEXT,
  "viewCount" INT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Admin & Notification Tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Notification" (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_userId ON "Notification"("userId");

CREATE TABLE IF NOT EXISTS "WithdrawRequest" (
  id SERIAL PRIMARY KEY,
  "vendorId" INT NOT NULL,
  amount FLOAT NOT NULL,
  "bankAccount" VARCHAR(255) NOT NULL,
  "bankName" VARCHAR(255) NOT NULL,
  "requestDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AdminReport" (
  id SERIAL PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  period VARCHAR(100) NOT NULL,
  data TEXT,
  "generatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AdminSettings" (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Admin Account Setup
-- ============================================================================
INSERT INTO "User" (email, password, name, role, status)
VALUES ('admin@apectech.vn', '$2b$10$h2c1REFx7y2CH7YQrubDDeKBikFLqZrKc.fIVo6pOd4Yb90Or2sle', 'Admin', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

-- ============================================================================
-- End of Database Schema
-- ============================================================================
