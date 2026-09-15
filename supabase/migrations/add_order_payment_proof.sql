-- Proof is submitted by the buyer and reconciled manually by the seller.
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentSubmittedAt" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "idx_order_payment_reconciliation"
  ON "Order" ("paymentStatus", "paymentSubmittedAt");
