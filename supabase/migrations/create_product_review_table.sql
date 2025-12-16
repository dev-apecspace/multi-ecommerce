CREATE TABLE "ProductReview" (
  id SERIAL PRIMARY KEY,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "orderId" INT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("productId", "userId", "orderId")
);

CREATE INDEX idx_productreview_productId ON "ProductReview"("productId");
CREATE INDEX idx_productreview_userId ON "ProductReview"("userId");
CREATE INDEX idx_productreview_orderId ON "ProductReview"("orderId");
CREATE INDEX idx_productreview_rating ON "ProductReview"("rating");
