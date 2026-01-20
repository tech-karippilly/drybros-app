-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'FIRED', 'SUSPENDED', 'BLOCKED');

-- AlterTable: Add status and suspendedUntil fields to Staff
ALTER TABLE "Staff" ADD COLUMN "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Staff" ADD COLUMN "suspendedUntil" TIMESTAMP(3);

-- Update existing staff records to have ACTIVE status
UPDATE "Staff" SET "status" = 'ACTIVE' WHERE "status" IS NULL;
