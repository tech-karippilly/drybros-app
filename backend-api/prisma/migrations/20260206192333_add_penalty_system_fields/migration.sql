/*
  Warnings:

  - You are about to drop the column `driverId` on the `Penalty` table. All the data in the column will be lost.
  - You are about to drop the `DriverPenalty` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PenaltyTriggerType" AS ENUM ('MANUAL', 'LATE_REPORT', 'THREE_COMPLAINTS', 'CANCELLED_TRIP', 'PHONE_NOT_ANSWERED', 'DRESS_CODE_VIOLATION', 'CUSTOMER_COMPLAINT');

-- CreateEnum
CREATE TYPE "PenaltyCategory" AS ENUM ('OPERATIONAL', 'BEHAVIORAL', 'FINANCIAL', 'SAFETY');

-- CreateEnum
CREATE TYPE "PenaltySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- DropForeignKey
ALTER TABLE "DriverPenalty" DROP CONSTRAINT "DriverPenalty_appliedBy_fkey";

-- DropForeignKey
ALTER TABLE "DriverPenalty" DROP CONSTRAINT "DriverPenalty_driverId_fkey";

-- DropForeignKey
ALTER TABLE "DriverPenalty" DROP CONSTRAINT "DriverPenalty_penaltyId_fkey";

-- DropForeignKey
ALTER TABLE "Penalty" DROP CONSTRAINT "Penalty_driverId_fkey";

-- DropIndex
DROP INDEX "Penalty_driverId_idx";

-- AlterTable
ALTER TABLE "DriverTransaction" ADD COLUMN     "appliedBy" UUID,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "penaltyId" UUID;

-- AlterTable
ALTER TABLE "Penalty" DROP COLUMN "driverId",
ADD COLUMN     "blockDriver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "category" "PenaltyCategory" NOT NULL DEFAULT 'OPERATIONAL',
ADD COLUMN     "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyAdmin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyDriver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyManager" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "severity" "PenaltySeverity" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "triggerConfig" JSONB,
ADD COLUMN     "triggerType" "PenaltyTriggerType" NOT NULL DEFAULT 'MANUAL';

-- DropTable
DROP TABLE "DriverPenalty";

-- CreateIndex
CREATE INDEX "DriverTransaction_penaltyId_idx" ON "DriverTransaction"("penaltyId");

-- CreateIndex
CREATE INDEX "DriverTransaction_appliedBy_idx" ON "DriverTransaction"("appliedBy");

-- CreateIndex
CREATE INDEX "Penalty_triggerType_idx" ON "Penalty"("triggerType");

-- CreateIndex
CREATE INDEX "Penalty_category_idx" ON "Penalty"("category");

-- CreateIndex
CREATE INDEX "Penalty_severity_idx" ON "Penalty"("severity");

-- AddForeignKey
ALTER TABLE "DriverTransaction" ADD CONSTRAINT "DriverTransaction_penaltyId_fkey" FOREIGN KEY ("penaltyId") REFERENCES "Penalty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTransaction" ADD CONSTRAINT "DriverTransaction_appliedBy_fkey" FOREIGN KEY ("appliedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
