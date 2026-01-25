-- Add incentive and bonus columns to Driver table
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "incentive" DECIMAL(10, 2);
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "bonus" DECIMAL(10, 2);
