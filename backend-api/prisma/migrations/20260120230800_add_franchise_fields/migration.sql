-- Add new fields to Franchise model
ALTER TABLE "Franchise" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "Franchise" ADD COLUMN IF NOT EXISTS "inchargeName" TEXT;
ALTER TABLE "Franchise" ADD COLUMN IF NOT EXISTS "storeImage" TEXT;
