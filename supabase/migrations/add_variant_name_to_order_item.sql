-- Add variantName column to OrderItem table to store variant name at time of purchase
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantName" VARCHAR(255);
