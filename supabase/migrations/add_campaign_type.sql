-- Add campaignType column to Campaign table to distinguish between regular promotions and flash sales
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "campaignType" VARCHAR(50) DEFAULT 'regular';

-- Add check constraint for valid campaign types
ALTER TABLE "Campaign" DROP CONSTRAINT IF EXISTS campaign_type_check;
ALTER TABLE "Campaign" ADD CONSTRAINT campaign_type_check CHECK ("campaignType" IN ('regular', 'flash_sale'));

-- Create index for faster filtering by campaign type
CREATE INDEX IF NOT EXISTS idx_campaign_campaignType ON "Campaign"("campaignType");
CREATE INDEX IF NOT EXISTS idx_campaign_campaignType_status ON "Campaign"("campaignType", "status");
