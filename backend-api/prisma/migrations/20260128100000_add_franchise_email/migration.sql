-- Add franchise email column
ALTER TABLE "Franchise" ADD COLUMN IF NOT EXISTS "email" TEXT;
