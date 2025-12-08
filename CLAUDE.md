# Shopping Cart & Product Variant System

## Latest Fixes

### 0. Simplified Multi-Vendor Order System (DONE)
**Issue**: Previous VendorOrder table was complex. Simplified to multiple Orders (one per vendor per checkout).

**Solution Applied**:
1. **Created migration**: `supabase/migrations/simplify_order_model.sql`
   - Removed `VendorOrder` table (no longer needed)
   - Made Order.vendorId NOT NULL (every order belongs to exactly one vendor)
   - Added `shippingCost` column to Order table for per-vendor shipping
   - Added indexes for faster queries

2. **Updated APIs**:
   - `app/api/client/orders/route.ts` 
     - POST: Groups cart items by vendor, creates multiple Orders (one per vendor)
     - GET: Fetches Orders with Vendor info directly
   - `app/api/seller/orders/route.ts` GET/PATCH: Queries Orders directly (vendor sees their own orders)
   - `app/api/admin/orders/route.ts` GET/PATCH: Simplified to query Orders directly
   - `app/api/orders/route.ts` (generic): Removed VendorOrder references

3. **Updated Pages**:
   - `app/client/checkout/page.tsx`: Single API call with all cart items (backend creates multiple Orders)
   - `app/client/order-history/page.tsx`: Simplified Order interface, shows Vendor name directly
   - `app/client/cart/page.tsx`: Pass variantId to checkout
   - Product page: Already had vendorId support when adding to cart

**Order Flow**:
- Customer buys: item1 (Vendor A) + item2,3 (Vendor B)
- System creates: Order1 (vendorId=A, item1), Order2 (vendorId=B, items 2,3)
- Customer pays once for total (all items + all shipping costs combined)
- Vendor A sees only Order1, Vendor B sees only Order2
- Customer sees both orders in order history (sorted by time)
- Each vendor approves/ships their order independently

**TODO: Run this migration in Supabase SQL Editor**:
```sql
-- Simplify Order model: remove VendorOrder table, make Order.vendorId NOT NULL

-- Add shippingCost column to Order for per-vendor shipping
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingCost" FLOAT DEFAULT 0;

-- Make vendorId NOT NULL (every order belongs to exactly one vendor)
ALTER TABLE "Order" ALTER COLUMN "vendorId" SET NOT NULL;

-- Drop VendorOrder table (no longer needed)
DROP TABLE IF EXISTS "VendorOrder" CASCADE;

-- Create index for faster vendor order queries
CREATE INDEX IF NOT EXISTS idx_order_vendorId_status ON "Order"("vendorId", "status");
```

### 1. Cart API with variantId Support (DONE)
**Issue**: Cart items weren't being saved to database because CartItem table was missing `variantId` support.

**Solution Applied**:
- **Created migration**: `supabase/migrations/add_variantid_to_cartitem.sql`
- **Updated API**: `app/api/cart/route.ts` to handle variantId
- **Updated UI**: `app/client/cart/page.tsx` displays variant names

### 2. Add to Cart for Products without Variants (DONE)
**Issue**: Products without variants couldn't be added to cart because the modal showed empty variants list.

**Solution Applied**:
1. **Updated**: `app/client/product/[slug]/page.tsx`
   - `handleAddToCart()` now checks if product has variants
   - If variants exist → shows modal for selection
   - If no variants → directly adds product to cart with `variantId: null`
   - `handleBuyNow()` has same logic for "Buy Now" button
   - API call sends `variantId: null` for products without variants

**TODO: Run this migration in Supabase SQL Editor**:
```sql
ALTER TABLE "CartItem" ADD COLUMN "variantId" INT;
ALTER TABLE "CartItem" ADD CONSTRAINT fk_cartitem_variant FOREIGN KEY ("variantId") REFERENCES "ProductVariant"(id) ON DELETE SET NULL;

ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_userId_productId_key";

ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_productId_variantId_key" UNIQUE("userId", "productId", "variantId");
```

## Current Implementation

### Attribute-Based Variant System
**Overview**: Product variants are now generated automatically from attributes

**Components Updated**:
1. **Frontend**: `app/seller/products/create/page.tsx`
   - New attribute management UI (add/edit/delete attributes and their values)
   - Auto-generates variant combinations in a table
   - Each variant can have SKU, Barcode, Price, Original Price, Stock

2. **API**: `app/api/seller/products/route.ts`
   - POST endpoint now accepts `attributes` array
   - Creates ProductAttribute and ProductAttributeValue records
   - Creates ProductVariant records with sku and barcode fields

3. **Database**: New migrations created
   - `add_sku_barcode_to_product_variant.sql` - Adds sku and barcode columns
   - `create_product_attributes_tables.sql` - Creates ProductAttribute and ProductAttributeValue tables

**TODO: Run these migrations in Supabase SQL Editor**:
```sql
-- Migration 1: Add SKU and Barcode
ALTER TABLE "ProductVariant" ADD COLUMN "sku" VARCHAR(255) UNIQUE;
ALTER TABLE "ProductVariant" ADD COLUMN "barcode" VARCHAR(255);
CREATE INDEX idx_productvariant_sku ON "ProductVariant"("sku");

-- Migration 2: Create Attribute Tables
CREATE TABLE "ProductAttribute" (
  id SERIAL PRIMARY KEY,
  "productId" INT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ProductAttributeValue" (
  id SERIAL PRIMARY KEY,
  "attributeId" INT NOT NULL REFERENCES "ProductAttribute"(id) ON DELETE CASCADE,
  value VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_productattribute_productId ON "ProductAttribute"("productId");
CREATE INDEX idx_productattributevalue_attributeId ON "ProductAttributeValue"("attributeId");
```

## Previous Fixes

### UserProfile Logo Issue (FIXED)
**Problem**: `/seller/settings` couldn't fetch vendor logo (vendorLogo field)

**Solution Applied**:
1. **Created**: `supabase/migrations/create_user_profile_table.sql`
2. **Created**: `supabase/migrations/create_user_profile_trigger.sql`
3. **Fixed**: `app/api/seller/vendor/route.ts` PATCH endpoint

## Completed Tasks

### Database
- Created migration: `supabase/migrations/add_status_to_product.sql`
  - Adds `status` column to Product table (default: 'pending')
  - Adds index on status for faster filtering

**TODO: Run this migration manually in Supabase SQL Editor**

### Seller Features
- **File**: `app/seller/products/create/page.tsx`
  - Updated form to fetch categories/subcategories dynamically
  - Submit product to API with userId
  - Shows loading and success states
  - Product starts with "pending" status

- **API**: `app/api/seller/products/route.ts`
  - GET: Fetch seller's products (with optional status filter)
  - POST: Create new product with userId

- **File**: `app/seller/products/page.tsx`
  - Updated to fetch seller's products from API
  - Shows product status (pending, approved, rejected)
  - "Add Product" button links to create form

### Admin Features
- **File**: `app/admin/products/page.tsx`
  - Tabs for pending/approved/rejected products
  - Stats showing counts for each status
  - Approve/Reject buttons for pending products
  - Shows vendor name, category, price, and date

- **API**: `app/api/admin/products/route.ts`
  - GET: List products by status
  - PATCH: Approve/reject products (updates status)

### Client Features
- **API**: `app/api/products/route.ts`
  - Updated to only return approved products by default
  - Can fetch all statuses with `?showPending=true` param

## Database Migration SQL

The migration needs to be applied to the database. Here's the SQL:

```sql
-- Add status column to Product table for admin approval workflow
ALTER TABLE "Product" ADD COLUMN "status" VARCHAR(50) DEFAULT 'pending';

-- Add index for faster filtering by status
CREATE INDEX idx_product_status ON "Product"("status");
```

## Workflow
1. Vendor creates product via `/seller/products/create` (status: pending)
2. Admin reviews pending products at `/admin/products`
3. Admin approves/rejects products
4. Only approved products show on `/client` for customers
5. Vendor sees all their products (all statuses) at `/seller/products`
