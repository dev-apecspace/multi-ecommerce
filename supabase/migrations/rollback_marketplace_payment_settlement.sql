-- Run this only if you want to remove the unused ZaloPay/settlement schema.
-- Review the three tables first; this permanently deletes any data they contain.

DROP TABLE IF EXISTS "SellerPayout";
DROP TABLE IF EXISTS "MarketplaceSettlement";
DROP TABLE IF EXISTS "ZaloPayPayment";

ALTER TABLE "Vendor" DROP CONSTRAINT IF EXISTS "Vendor_taxpayerType_check";
ALTER TABLE "Vendor"
  DROP COLUMN IF EXISTS "settlementAgreementAcceptedAt",
  DROP COLUMN IF EXISTS "payoutAccountVerifiedAt",
  DROP COLUMN IF EXISTS "taxCode",
  DROP COLUMN IF EXISTS "taxpayerType";
