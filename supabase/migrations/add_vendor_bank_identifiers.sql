-- VietQR identifiers are stable and let the checkout generate QR without guessing bank names.
ALTER TABLE "Vendor"
  ADD COLUMN IF NOT EXISTS "bankCode" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "bankBin" VARCHAR(20);

CREATE INDEX IF NOT EXISTS "idx_vendor_bank_bin" ON "Vendor" ("bankBin");
