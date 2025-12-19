-- Create Favorite table for product wishlist
CREATE TABLE IF NOT EXISTS "Favorite" (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "productId")
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_favorite_userId ON "Favorite"("userId");
CREATE INDEX IF NOT EXISTS idx_favorite_productId ON "Favorite"("productId");
CREATE INDEX IF NOT EXISTS idx_favorite_createdAt ON "Favorite"("createdAt");
