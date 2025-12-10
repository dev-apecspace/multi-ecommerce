-- Create Campaign table (chương trình khuyễn mãi)
CREATE TABLE IF NOT EXISTS "Campaign" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'percentage' or 'fixed'
  discountValue FLOAT NOT NULL, -- percentage (0-100) or fixed amount
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft' (Khởi tạo), 'upcoming', 'active', 'ended'
  budget FLOAT, -- optional budget limit
  "createdBy" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaign_status ON "Campaign"("status");
CREATE INDEX IF NOT EXISTS idx_campaign_startDate_endDate ON "Campaign"("startDate", "endDate");

-- Create table for vendor participation in campaigns
CREATE TABLE IF NOT EXISTS "CampaignVendorRegistration" (
  id SERIAL PRIMARY KEY,
  "campaignId" INT NOT NULL REFERENCES "Campaign"(id) ON DELETE CASCADE,
  "vendorId" INT NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  "registeredAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP,
  "approvedBy" INT REFERENCES "User"(id) ON DELETE SET NULL,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("campaignId", "vendorId")
);

CREATE INDEX IF NOT EXISTS idx_campaignvendorregistration_campaignId ON "CampaignVendorRegistration"("campaignId");
CREATE INDEX IF NOT EXISTS idx_campaignvendorregistration_vendorId ON "CampaignVendorRegistration"("vendorId");
CREATE INDEX IF NOT EXISTS idx_campaignvendorregistration_status ON "CampaignVendorRegistration"("status");

-- Create table for products registered in campaigns
CREATE TABLE IF NOT EXISTS "CampaignProduct" (
  id SERIAL PRIMARY KEY,
  "campaignId" INT NOT NULL REFERENCES "Campaign"(id) ON DELETE CASCADE,
  "vendorId" INT NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "variantId" INT REFERENCES "ProductVariant"(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 0, -- allocated quantity for this campaign
  "purchasedQuantity" INT DEFAULT 0, -- number of items sold
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  "registeredAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP,
  "approvedBy" INT REFERENCES "User"(id) ON DELETE SET NULL,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("campaignId", "productId", "variantId")
);

CREATE INDEX IF NOT EXISTS idx_campaignproduct_campaignId ON "CampaignProduct"("campaignId");
CREATE INDEX IF NOT EXISTS idx_campaignproduct_vendorId ON "CampaignProduct"("vendorId");
CREATE INDEX IF NOT EXISTS idx_campaignproduct_productId ON "CampaignProduct"("productId");
CREATE INDEX IF NOT EXISTS idx_campaignproduct_status ON "CampaignProduct"("status");

DO $$
BEGIN
  -- If legacy lower-case column exists, make it safe first
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Campaign' AND column_name = 'discountvalue'
  ) THEN
    -- Provide default and backfill to avoid NOT NULL violations on existing rows
    ALTER TABLE "Campaign"
      ALTER COLUMN "discountvalue" SET DEFAULT 0;
    UPDATE "Campaign" SET "discountvalue" = 0 WHERE "discountvalue" IS NULL;
    ALTER TABLE "Campaign"
      ALTER COLUMN "discountvalue" SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Campaign' AND column_name = 'discountValue'
  ) THEN
    ALTER TABLE "Campaign" ADD COLUMN "discountValue" FLOAT;
    -- Migrate data from lower-case column if it was previously created
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Campaign' AND column_name = 'discountvalue'
    ) THEN
      EXECUTE 'UPDATE "Campaign" SET "discountValue" = discountvalue';
    END IF;
    ALTER TABLE "Campaign"
      ALTER COLUMN "discountValue" SET NOT NULL,
      ALTER COLUMN "discountValue" SET DEFAULT 0;
  END IF;
END $$;

-- Normalize campaign status values and enforce the four valid states
DO $$
BEGIN
  -- Set default to the new initial state
  ALTER TABLE "Campaign" ALTER COLUMN status SET DEFAULT 'draft';

  -- Backfill/normalize existing records
  UPDATE "Campaign" SET status = 'draft' WHERE status IS NULL OR status IN ('pending', 'inactive');
  -- Keep explicit upcoming/active/ended as-is; any other stray values go to ended
  UPDATE "Campaign" SET status = 'ended' WHERE status NOT IN ('draft', 'upcoming', 'active', 'ended');

  -- Add a check constraint if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaign_status_check'
  ) THEN
    ALTER TABLE "Campaign"
      ADD CONSTRAINT campaign_status_check CHECK (status IN ('draft', 'upcoming', 'active', 'ended'));
  END IF;
END $$;