-- Fix Role.updatedAt to be auto-updated
-- Ensure existing records have updatedAt set
UPDATE "Role" SET "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()) WHERE "updatedAt" IS NULL;

-- Add default value to updatedAt column to ensure it's always set
-- This works with Prisma's @updatedAt attribute
ALTER TABLE "Role" ALTER COLUMN "updatedAt" SET DEFAULT NOW();
