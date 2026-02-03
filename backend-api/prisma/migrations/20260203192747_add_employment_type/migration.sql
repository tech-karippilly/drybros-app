/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `driverCode` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `emergencyContactName` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `emergencyContactPhone` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `emergencyContactRelation` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pincode` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `licenseNumber` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `licenseExpDate` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bankAccountName` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bankAccountNumber` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bankIfscCode` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `carTypes` on table `Driver` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DriverEmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT');

-- CreateEnum
CREATE TYPE "DriverTripStatus" AS ENUM ('AVAILABLE', 'ON_TRIP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'LOGIN';
ALTER TYPE "ActivityAction" ADD VALUE 'LOGOUT';
ALTER TYPE "ActivityAction" ADD VALUE 'CHECK_IN';
ALTER TYPE "ActivityAction" ADD VALUE 'CHECK_OUT';

-- AlterEnum
ALTER TYPE "ActivityEntityType" ADD VALUE 'USER';

-- AlterEnum
ALTER TYPE "PaymentMode" ADD VALUE 'IN_HAND';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TripStatus" ADD VALUE 'PENDING';
ALTER TYPE "TripStatus" ADD VALUE 'NOT_ASSIGNED';
ALTER TYPE "TripStatus" ADD VALUE 'TRIP_STARTED';
ALTER TYPE "TripStatus" ADD VALUE 'TRIP_PROGRESS';
ALTER TYPE "TripStatus" ADD VALUE 'TRIP_ENDED';
ALTER TYPE "TripStatus" ADD VALUE 'PAYMENT_DONE';

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_franchiseId_fkey";

-- DropIndex
DROP INDEX "Driver_createdAt_idx";

-- DropIndex
DROP INDEX "Driver_franchiseId_idx";

-- DropIndex
DROP INDEX "Driver_isActive_idx";

-- DropIndex
DROP INDEX "Driver_isActive_status_idx";

-- DropIndex
DROP INDEX "Driver_status_idx";

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "AttendanceSession" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "cashInHand" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "driverTripStatus" "DriverTripStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "employmentType" "DriverEmploymentType",
ADD COLUMN     "licenseType" TEXT,
ADD COLUMN     "remainingDailyLimit" DECIMAL(10,2),
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "driverCode" SET NOT NULL,
ALTER COLUMN "password" SET NOT NULL,
ALTER COLUMN "emergencyContactName" SET NOT NULL,
ALTER COLUMN "emergencyContactPhone" SET NOT NULL,
ALTER COLUMN "emergencyContactRelation" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL,
ALTER COLUMN "pincode" SET NOT NULL,
ALTER COLUMN "licenseNumber" SET NOT NULL,
ALTER COLUMN "licenseExpDate" SET NOT NULL,
ALTER COLUMN "bankAccountName" SET NOT NULL,
ALTER COLUMN "bankAccountNumber" SET NOT NULL,
ALTER COLUMN "bankIfscCode" SET NOT NULL,
ALTER COLUMN "carTypes" SET NOT NULL;

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "alternativePhone" TEXT,
ADD COLUMN     "carType" TEXT,
ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "dropAddress" TEXT,
ADD COLUMN     "dropLocationNote" TEXT,
ADD COLUMN     "isDetailsReconfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFareDiscussed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPriceAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupAddress" TEXT,
ADD COLUMN     "pickupLocationNote" TEXT,
ADD COLUMN     "tripPlacedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "TripOffer" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "DriverEarningsConfig" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "franchiseId" UUID,
    "driverId" UUID,
    "dailyTargetDefault" INTEGER NOT NULL DEFAULT 1250,
    "incentiveTier1Min" INTEGER NOT NULL DEFAULT 1250,
    "incentiveTier1Max" INTEGER NOT NULL DEFAULT 1550,
    "incentiveTier1Type" TEXT NOT NULL DEFAULT 'full_extra',
    "incentiveTier2Min" INTEGER NOT NULL DEFAULT 1550,
    "incentiveTier2Percent" INTEGER NOT NULL DEFAULT 20,
    "monthlyBonusTiers" JSONB,
    "monthlyDeductionTiers" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "DriverEarningsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripReview" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tripId" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "franchiseId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverEarningsConfig_franchiseId_idx" ON "DriverEarningsConfig"("franchiseId");

-- CreateIndex
CREATE INDEX "DriverEarningsConfig_driverId_idx" ON "DriverEarningsConfig"("driverId");

-- CreateIndex
CREATE INDEX "DriverEarningsConfig_franchiseId_driverId_idx" ON "DriverEarningsConfig"("franchiseId", "driverId");

-- CreateIndex
CREATE INDEX "TripReview_tripId_idx" ON "TripReview"("tripId");

-- CreateIndex
CREATE INDEX "TripReview_driverId_idx" ON "TripReview"("driverId");

-- CreateIndex
CREATE INDEX "TripReview_customerId_idx" ON "TripReview"("customerId");

-- CreateIndex
CREATE INDEX "TripReview_franchiseId_idx" ON "TripReview"("franchiseId");

-- CreateIndex
CREATE INDEX "Attendance_userId_date_custom_idx" ON "Attendance"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_userId_date_key" ON "Attendance"("userId", "date");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
