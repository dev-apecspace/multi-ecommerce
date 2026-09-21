CREATE TABLE IF NOT EXISTS "VendorMonthlyFeeConfig" (
  "vendorId" INT PRIMARY KEY REFERENCES "Vendor"(id) ON DELETE CASCADE,
  "feeType" VARCHAR(20) NOT NULL DEFAULT 'fixed' CHECK ("feeType" IN ('fixed', 'percentage')),
  "fixedMonthlyFee" NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK ("fixedMonthlyFee" >= 0),
  "revenueFeePercent" NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK ("revenueFeePercent" >= 0 AND "revenueFeePercent" <= 100),
  "effectiveFrom" DATE NOT NULL DEFAULT CURRENT_DATE,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "VendorMonthlyFeeConfig"
  ADD COLUMN IF NOT EXISTS "feeType" VARCHAR(20) NOT NULL DEFAULT 'fixed';

ALTER TABLE "VendorMonthlyFeeConfig"
  DROP CONSTRAINT IF EXISTS "VendorMonthlyFeeConfig_feeType_check";

ALTER TABLE "VendorMonthlyFeeConfig"
  ADD CONSTRAINT "VendorMonthlyFeeConfig_feeType_check"
  CHECK ("feeType" IN ('fixed', 'percentage'));

CREATE TABLE IF NOT EXISTS "VendorMonthlyFee" (
  id BIGSERIAL PRIMARY KEY,
  "vendorId" INT NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  "billingMonth" DATE NOT NULL,
  "settledRevenue" NUMERIC(15, 2) NOT NULL DEFAULT 0,
  "feeType" VARCHAR(20) NOT NULL CHECK ("feeType" IN ('fixed', 'percentage')),
  "fixedFee" NUMERIC(15, 2) NOT NULL DEFAULT 0,
  "revenueFeePercent" NUMERIC(5, 2) NOT NULL DEFAULT 0,
  "percentageFee" NUMERIC(15, 2) NOT NULL DEFAULT 0,
  "totalFee" NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'uncollected' CHECK (status IN ('uncollected', 'collected')),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("vendorId", "billingMonth")
);

ALTER TABLE "VendorMonthlyFee"
  ADD COLUMN IF NOT EXISTS "feeType" VARCHAR(20) NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS "collectedAmount" NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK ("collectedAmount" >= 0),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'uncollected';

UPDATE "VendorMonthlyFee" SET status = 'uncollected' WHERE status NOT IN ('uncollected', 'partially_collected', 'collected');

ALTER TABLE "VendorMonthlyFee"
  DROP CONSTRAINT IF EXISTS "VendorMonthlyFee_status_check",
  DROP CONSTRAINT IF EXISTS "VendorMonthlyFee_feeType_check";

ALTER TABLE "VendorMonthlyFee"
  ADD CONSTRAINT "VendorMonthlyFee_status_check" CHECK (status IN ('uncollected', 'partially_collected', 'collected')),
  ADD CONSTRAINT "VendorMonthlyFee_feeType_check" CHECK ("feeType" IN ('fixed', 'percentage'));

CREATE INDEX IF NOT EXISTS "idx_vendor_monthly_fee_month" ON "VendorMonthlyFee"("billingMonth");
