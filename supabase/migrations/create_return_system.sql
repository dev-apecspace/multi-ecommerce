-- Create Return table for product returns/exchanges
CREATE TABLE IF NOT EXISTS "Return" (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "orderId" INT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "orderItemId" INT NOT NULL REFERENCES "OrderItem"(id) ON DELETE CASCADE,
  "vendorId" INT NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "variantId" INT REFERENCES "ProductVariant"(id) ON DELETE SET NULL,
  
  -- Return details
  reason VARCHAR(255) NOT NULL, -- defective, wrong_item, not_as_described, changed_mind, damaged, missing_items, size_issue, other
  description TEXT,
  "returnType" VARCHAR(50) NOT NULL DEFAULT 'return', -- return, exchange
  "exchangeVariantId" INT REFERENCES "ProductVariant"(id) ON DELETE SET NULL, -- for exchanges
  
  -- Return images
  images TEXT[], -- array of image URLs
  
  -- Refund details
  "refundAmount" FLOAT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, shipped, completed, cancelled
  "sellerNotes" TEXT,
  "adminNotes" TEXT,
  
  -- Timeline
  "requestedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP,
  "shippedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "cancelledAt" TIMESTAMP,
  
  -- Tracking
  "trackingNumber" VARCHAR(255),
  "trackingUrl" VARCHAR(255),
  
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_return_userId ON "Return"("userId");
CREATE INDEX idx_return_orderId ON "Return"("orderId");
CREATE INDEX idx_return_vendorId ON "Return"("vendorId");
CREATE INDEX idx_return_status ON "Return"(status);
CREATE INDEX idx_return_createdAt ON "Return"("createdAt" DESC);

-- Create a trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_return_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_return_timestamp
BEFORE UPDATE ON "Return"
FOR EACH ROW
EXECUTE FUNCTION update_return_timestamp();
