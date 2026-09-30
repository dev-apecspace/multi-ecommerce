-- Independent controls preserve approval and each actor's visibility decision.
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "sellerHidden" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "adminHidden" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "adminLocked" boolean NOT NULL DEFAULT false;
