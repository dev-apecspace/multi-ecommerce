-- Add all missing shop and business information columns to Vendor table
-- This migration adds columns required for vendor settings management

DO $$ 
BEGIN
    -- Add taxId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Vendor' AND column_name = 'taxId'
    ) THEN
        ALTER TABLE "Vendor" ADD COLUMN "taxId" VARCHAR(255);
    END IF;

    -- Add businessLicense column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Vendor' AND column_name = 'businessLicense'
    ) THEN
        ALTER TABLE "Vendor" ADD COLUMN "businessLicense" VARCHAR(255);
    END IF;

    -- Add logo column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Vendor' AND column_name = 'logo'
    ) THEN
        ALTER TABLE "Vendor" ADD COLUMN "logo" VARCHAR(255);
    END IF;

    -- Add coverImage column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Vendor' AND column_name = 'coverImage'
    ) THEN
        ALTER TABLE "Vendor" ADD COLUMN "coverImage" VARCHAR(255);
    END IF;

    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Vendor' AND column_name = 'description'
    ) THEN
        ALTER TABLE "Vendor" ADD COLUMN "description" TEXT;
    END IF;

    -- Add businessAddress column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Vendor' AND column_name = 'businessAddress'
    ) THEN
        ALTER TABLE "Vendor" ADD COLUMN "businessAddress" VARCHAR(255);
    END IF;

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
