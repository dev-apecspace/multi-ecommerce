-- Optional e-wallet receiving information for vendor checkout payments.
ALTER TABLE "Vendor"
  ADD COLUMN IF NOT EXISTS "walletProvider" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "walletAccount" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "walletQrUrl" TEXT;
