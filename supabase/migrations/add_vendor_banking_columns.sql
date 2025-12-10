-- Add banking information columns to Vendor table
-- This migration adds bankAccount, bankName, and bankBranch columns to the Vendor table

-- Check if columns exist before adding them
DO $$ 
BEGIN
    -- Add bankAccount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Vendor' AND column_name = 'bankAccount'
    ) THEN
        ALTER TABLE "Vendor" ADD COLUMN "bankAccount" VARCHAR(255);
    END IF;

    -- Add bankName column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Vendor' AND column_name = 'bankName'
    ) THEN
        ALTER TABLE "Vendor" ADD COLUMN "bankName" VARCHAR(255);
    END IF;

    -- Add bankBranch column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Vendor' AND column_name = 'bankBranch'
    ) THEN
        ALTER TABLE "Vendor" ADD COLUMN "bankBranch" VARCHAR(255);
    END IF;
END $$;

