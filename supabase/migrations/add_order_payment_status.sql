-- Add paymentStatus column to Order table
-- This migration adds paymentStatus column to track payment status for orders

-- Check if column exists before adding it
DO $$ 
BEGIN
    -- Add paymentStatus column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'paymentStatus'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "paymentStatus" VARCHAR(50) DEFAULT 'pending';
        
        -- Update existing orders based on paymentMethod
        -- COD orders: pending (will be paid on delivery)
        -- Bank transfer orders: pending (needs confirmation)
        -- Wallet orders: paid (paid immediately)
        UPDATE "Order" 
        SET "paymentStatus" = CASE 
            WHEN "paymentMethod" = 'wallet' THEN 'paid'
            ELSE 'pending'
        END
        WHERE "paymentStatus" IS NULL;
    END IF;
END $$;

