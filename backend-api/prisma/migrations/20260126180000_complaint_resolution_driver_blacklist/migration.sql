-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ComplaintResolutionAction" AS ENUM ('WARNING', 'FIRE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable Driver: blacklisted, warningCount
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "blacklisted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "warningCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Staff: warningCount
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "warningCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Complaint: resolutionAction, resolutionReason
ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "resolutionAction" "ComplaintResolutionAction";
ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "resolutionReason" TEXT;
