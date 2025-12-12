-- Add tax fields to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "taxApplied" BOOLEAN DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "taxRate" FLOAT DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "taxIncluded" BOOLEAN DEFAULT true;

-- Create index for tax queries
CREATE INDEX IF NOT EXISTS idx_product_taxApplied ON "Product"("taxApplied");
CREATE INDEX IF NOT EXISTS idx_product_taxIncluded ON "Product"("taxIncluded");
