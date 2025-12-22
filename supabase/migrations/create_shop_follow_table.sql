-- Create ShopFollow table for tracking user-shop follows
CREATE TABLE IF NOT EXISTS "ShopFollow" (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "vendorId" INT NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "vendorId")
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shopfollow_userId ON "ShopFollow"("userId");
CREATE INDEX IF NOT EXISTS idx_shopfollow_vendorId ON "ShopFollow"("vendorId");
