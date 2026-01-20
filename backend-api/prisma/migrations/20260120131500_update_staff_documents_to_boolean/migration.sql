-- AlterTable: Change document fields from String to Boolean
-- Drop existing columns
ALTER TABLE "Staff" DROP COLUMN IF EXISTS "govtId";
ALTER TABLE "Staff" DROP COLUMN IF EXISTS "addressProof";
ALTER TABLE "Staff" DROP COLUMN IF EXISTS "certificates";
ALTER TABLE "Staff" DROP COLUMN IF EXISTS "previousExperienceCert";

-- Add new boolean columns with default false
ALTER TABLE "Staff" ADD COLUMN "govtId" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Staff" ADD COLUMN "addressProof" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Staff" ADD COLUMN "certificates" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Staff" ADD COLUMN "previousExperienceCert" BOOLEAN NOT NULL DEFAULT false;
