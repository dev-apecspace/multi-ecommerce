-- AI-assisted verification is advisory only; the seller remains the final approver.
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "paymentVerificationStatus" VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "paymentVerificationData" JSONB,
  ADD COLUMN IF NOT EXISTS "paymentVerifiedAt" TIMESTAMPTZ;

ALTER TABLE "Order"
  DROP CONSTRAINT IF EXISTS "Order_paymentVerificationStatus_check";

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_paymentVerificationStatus_check"
  CHECK ("paymentVerificationStatus" IN ('pending', 'verified', 'review', 'rejected', 'unavailable', 'error'));

CREATE INDEX IF NOT EXISTS "idx_order_payment_verification"
  ON "Order" ("paymentVerificationStatus", "paymentSubmittedAt");
