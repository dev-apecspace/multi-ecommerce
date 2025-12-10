-- Create Voucher table
CREATE TABLE IF NOT EXISTS "Voucher" (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  "vendorId" INT NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('private', 'public')),
  "discountType" VARCHAR(50) NOT NULL CHECK ("discountType" IN ('percentage', 'fixed')),
  "discountValue" FLOAT NOT NULL,
  "maxDiscount" FLOAT,
  "minOrderValue" FLOAT DEFAULT 0,
  "maxUsagePerUser" INT DEFAULT 1,
  "totalUsageLimit" INT,
  "usageCount" INT DEFAULT 0,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  active BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'pending',
  "approvedBy" INT REFERENCES "User"(id) ON DELETE SET NULL,
  "approvedAt" TIMESTAMP,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_voucher_vendorId ON "Voucher"("vendorId");
CREATE INDEX IF NOT EXISTS idx_voucher_code ON "Voucher"(code);
CREATE INDEX IF NOT EXISTS idx_voucher_status ON "Voucher"(status);
CREATE INDEX IF NOT EXISTS idx_voucher_type ON "Voucher"(type);
CREATE INDEX IF NOT EXISTS idx_voucher_active ON "Voucher"(active);

-- Create VoucherUsage table to track voucher usage
CREATE TABLE IF NOT EXISTS "VoucherUsage" (
  id SERIAL PRIMARY KEY,
  "voucherId" INT NOT NULL REFERENCES "Voucher"(id) ON DELETE CASCADE,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "orderId" INT REFERENCES "Order"(id) ON DELETE SET NULL,
  "discountAmount" FLOAT NOT NULL,
  "usedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_voucherusage_voucherId ON "VoucherUsage"("voucherId");
CREATE INDEX IF NOT EXISTS idx_voucherusage_userId ON "VoucherUsage"("userId");
CREATE INDEX IF NOT EXISTS idx_voucherusage_orderId ON "VoucherUsage"("orderId");

-- Create VoucherTargetProduct table to link vouchers to specific products (optional for private vouchers)
CREATE TABLE IF NOT EXISTS "VoucherTargetProduct" (
  id SERIAL PRIMARY KEY,
  "voucherId" INT NOT NULL REFERENCES "Voucher"(id) ON DELETE CASCADE,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("voucherId", "productId")
);

CREATE INDEX IF NOT EXISTS idx_vouchertargetproduct_voucherId ON "VoucherTargetProduct"("voucherId");
