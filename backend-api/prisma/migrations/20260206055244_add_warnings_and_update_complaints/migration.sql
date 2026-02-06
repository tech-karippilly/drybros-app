/*
  Warnings:

  - The values [OPEN,IN_PROGRESS,CLOSED] on the enum `ComplaintStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `severity` on the `Complaint` table. All the data in the column will be lost.
  - Added the required column `customerName` to the `Complaint` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "WarningPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- Add new columns first with defaults/nullable
ALTER TABLE "Complaint" 
ADD COLUMN "customerName" TEXT,
ADD COLUMN "priority" "ComplaintPriority" DEFAULT 'MEDIUM',
ADD COLUMN "tripId" UUID;

-- Update existing data: copy severity to priority (map CRITICAL to HIGH)
UPDATE "Complaint" SET "priority" = 
  CASE 
    WHEN "severity" = 'CRITICAL' THEN 'HIGH'::"ComplaintPriority"
    WHEN "severity" = 'HIGH' THEN 'HIGH'::"ComplaintPriority"
    WHEN "severity" = 'MEDIUM' THEN 'MEDIUM'::"ComplaintPriority"
    WHEN "severity" = 'LOW' THEN 'LOW'::"ComplaintPriority"
    ELSE 'MEDIUM'::"ComplaintPriority"
  END;

-- Set customerName to 'Unknown' for existing records (can be updated later)
UPDATE "Complaint" SET "customerName" = 'Unknown' WHERE "customerName" IS NULL;

-- Make customerName and priority NOT NULL
ALTER TABLE "Complaint" 
ALTER COLUMN "customerName" SET NOT NULL,
ALTER COLUMN "priority" SET NOT NULL;

-- AlterEnum - Map existing statuses to new ones
-- OPEN -> RECEIVED, IN_PROGRESS -> IN_PROCESS, CLOSED/RESOLVED -> RESOLVED

BEGIN;
CREATE TYPE "ComplaintStatus_new" AS ENUM ('RECEIVED', 'IN_PROCESS', 'RESOLVED');
ALTER TABLE "Complaint" ALTER COLUMN "status" DROP DEFAULT;
-- First convert old values to new enum using CASE
ALTER TABLE "Complaint" ALTER COLUMN "status" TYPE "ComplaintStatus_new" 
  USING (
    CASE "status"::text
      WHEN 'OPEN' THEN 'RECEIVED'::"ComplaintStatus_new"
      WHEN 'IN_PROGRESS' THEN 'IN_PROCESS'::"ComplaintStatus_new"
      WHEN 'RESOLVED' THEN 'RESOLVED'::"ComplaintStatus_new"
      WHEN 'CLOSED' THEN 'RESOLVED'::"ComplaintStatus_new"
      ELSE 'RECEIVED'::"ComplaintStatus_new"
    END
  );
ALTER TYPE "ComplaintStatus" RENAME TO "ComplaintStatus_old";
ALTER TYPE "ComplaintStatus_new" RENAME TO "ComplaintStatus";
DROP TYPE "ComplaintStatus_old";
ALTER TABLE "Complaint" ALTER COLUMN "status" SET DEFAULT 'RECEIVED';
COMMIT;

-- Drop severity column after data migration
ALTER TABLE "Complaint" DROP COLUMN "severity";

-- DropEnum
DROP TYPE "ComplaintSeverity";

-- CreateTable
CREATE TABLE "Warning" (
    "id" UUID NOT NULL,
    "driverId" UUID,
    "staffId" UUID,
    "reason" TEXT NOT NULL,
    "priority" "WarningPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Warning_driverId_idx" ON "Warning"("driverId");

-- CreateIndex
CREATE INDEX "Warning_staffId_idx" ON "Warning"("staffId");

-- CreateIndex
CREATE INDEX "Warning_createdAt_idx" ON "Warning"("createdAt");

-- CreateIndex
CREATE INDEX "Complaint_tripId_idx" ON "Complaint"("tripId");

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
