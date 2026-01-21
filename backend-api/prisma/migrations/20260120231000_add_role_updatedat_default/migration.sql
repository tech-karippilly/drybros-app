-- Add default value to Role.updatedAt column
-- This ensures the column always has a value, working with Prisma's @updatedAt attribute
ALTER TABLE "Role" ALTER COLUMN "updatedAt" SET DEFAULT NOW();

-- Update any existing records that might have NULL updatedAt
UPDATE "Role" SET "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()) WHERE "updatedAt" IS NULL;
