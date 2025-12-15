-- Add time-based fields for flash sales to enable time-of-day constraints
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "flashSaleStartTime" TIME;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "flashSaleEndTime" TIME;

-- Add index for flash sale queries
CREATE INDEX IF NOT EXISTS idx_campaign_flashsale_times ON "Campaign"("campaignType", "flashSaleStartTime", "flashSaleEndTime") WHERE "campaignType" = 'flash_sale';
