/*
  Warnings:

  - You are about to drop the column `carCategories` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `carTypes` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `transmissionTypes` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `carGearType` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `carType` on the `Trip` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CarType" AS ENUM ('HATCHBACK', 'SEDAN', 'SUV', 'LUXURY');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "carCategories",
DROP COLUMN "carTypes",
DROP COLUMN "transmissionTypes",
ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "carGearType",
DROP COLUMN "carType",
ADD COLUMN     "assignedCarId" UUID,
ADD COLUMN     "requiredCarType" "CarType",
ADD COLUMN     "requiredTransmission" "Transmission";

-- DropEnum
DROP TYPE "TransmissionType";

-- CreateTable
CREATE TABLE "DriverCar" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "carType" "CarType" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "registrationNo" TEXT NOT NULL,
    "color" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverCar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverMonthlyPerformance" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "franchiseId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "acceptedTrips" INTEGER NOT NULL DEFAULT 0,
    "cancelledTrips" INTEGER NOT NULL DEFAULT 0,
    "totalDistance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalEarnings" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalIncentive" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalPenalty" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "monthlyDeduction" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION,
    "complaintCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "attendancePercentage" DOUBLE PRECISION,
    "performanceScore" DOUBLE PRECISION,
    "grade" TEXT,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverMonthlyPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMonthlyPerformance" (
    "id" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "franchiseId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalBookingsCreated" INTEGER NOT NULL DEFAULT 0,
    "totalAssignments" INTEGER NOT NULL DEFAULT 0,
    "reassignmentCount" INTEGER NOT NULL DEFAULT 0,
    "complaintsHandled" INTEGER NOT NULL DEFAULT 0,
    "unresolvedComplaints" INTEGER NOT NULL DEFAULT 0,
    "attendancePercentage" DOUBLE PRECISION,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" DOUBLE PRECISION,
    "grade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMonthlyPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagerMonthlyPerformance" (
    "id" UUID NOT NULL,
    "managerId" UUID NOT NULL,
    "franchiseId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "driverRetentionRate" DOUBLE PRECISION,
    "staffRetentionRate" DOUBLE PRECISION,
    "totalComplaints" INTEGER NOT NULL DEFAULT 0,
    "resolvedComplaints" INTEGER NOT NULL DEFAULT 0,
    "avgDriverRating" DOUBLE PRECISION,
    "payrollAccuracy" DOUBLE PRECISION,
    "performanceScore" DOUBLE PRECISION,
    "grade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagerMonthlyPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FranchiseMonthlyPerformance" (
    "id" UUID NOT NULL,
    "franchiseId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "activeDrivers" INTEGER NOT NULL DEFAULT 0,
    "activeStaff" INTEGER NOT NULL DEFAULT 0,
    "totalComplaints" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION,
    "netProfit" DECIMAL(14,2),
    "performanceScore" DOUBLE PRECISION,
    "grade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseMonthlyPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupRequest" (
    "id" UUID NOT NULL,
    "originalTripId" UUID NOT NULL,
    "pickupDriverId" UUID,
    "distanceKm" DECIMAL(10,2),
    "payoutAmount" DECIMAL(10,2),
    "status" "PickupStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PickupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripReassignment" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "oldDriverId" TEXT,
    "newDriverId" TEXT,
    "reason" TEXT,
    "reassignedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripReassignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripReschedule" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "oldDate" TIMESTAMP(3) NOT NULL,
    "newDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "rescheduledBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripReschedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverPayroll" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "franchiseId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalTrips" INTEGER NOT NULL,
    "totalEarnings" DECIMAL(14,2) NOT NULL,
    "totalIncentives" DECIMAL(14,2) NOT NULL,
    "totalPenalties" DECIMAL(14,2) NOT NULL,
    "monthlyDeduction" DECIMAL(14,2) NOT NULL,
    "finalPayout" DECIMAL(14,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverPayroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetOTP" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetOTP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverCar_registrationNo_key" ON "DriverCar"("registrationNo");

-- CreateIndex
CREATE INDEX "DriverCar_driverId_idx" ON "DriverCar"("driverId");

-- CreateIndex
CREATE INDEX "DriverCar_carType_idx" ON "DriverCar"("carType");

-- CreateIndex
CREATE INDEX "DriverCar_transmission_idx" ON "DriverCar"("transmission");

-- CreateIndex
CREATE INDEX "DriverMonthlyPerformance_franchiseId_month_year_idx" ON "DriverMonthlyPerformance"("franchiseId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "DriverMonthlyPerformance_driverId_month_year_key" ON "DriverMonthlyPerformance"("driverId", "month", "year");

-- CreateIndex
CREATE INDEX "StaffMonthlyPerformance_franchiseId_month_year_idx" ON "StaffMonthlyPerformance"("franchiseId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMonthlyPerformance_staffId_month_year_key" ON "StaffMonthlyPerformance"("staffId", "month", "year");

-- CreateIndex
CREATE INDEX "ManagerMonthlyPerformance_franchiseId_month_year_idx" ON "ManagerMonthlyPerformance"("franchiseId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ManagerMonthlyPerformance_managerId_month_year_key" ON "ManagerMonthlyPerformance"("managerId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseMonthlyPerformance_franchiseId_month_year_key" ON "FranchiseMonthlyPerformance"("franchiseId", "month", "year");

-- CreateIndex
CREATE INDEX "PickupRequest_status_idx" ON "PickupRequest"("status");

-- CreateIndex
CREATE INDEX "TripReassignment_tripId_idx" ON "TripReassignment"("tripId");

-- CreateIndex
CREATE INDEX "TripReschedule_tripId_idx" ON "TripReschedule"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverPayroll_driverId_month_year_key" ON "DriverPayroll"("driverId", "month", "year");

-- CreateIndex
CREATE INDEX "PasswordResetOTP_email_expiresAt_idx" ON "PasswordResetOTP"("email", "expiresAt");

-- CreateIndex
CREATE INDEX "Trip_assignedCarId_idx" ON "Trip"("assignedCarId");

-- AddForeignKey
ALTER TABLE "DriverCar" ADD CONSTRAINT "DriverCar_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_assignedCarId_fkey" FOREIGN KEY ("assignedCarId") REFERENCES "DriverCar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverMonthlyPerformance" ADD CONSTRAINT "DriverMonthlyPerformance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverMonthlyPerformance" ADD CONSTRAINT "DriverMonthlyPerformance_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMonthlyPerformance" ADD CONSTRAINT "StaffMonthlyPerformance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMonthlyPerformance" ADD CONSTRAINT "StaffMonthlyPerformance_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerMonthlyPerformance" ADD CONSTRAINT "ManagerMonthlyPerformance_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerMonthlyPerformance" ADD CONSTRAINT "ManagerMonthlyPerformance_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseMonthlyPerformance" ADD CONSTRAINT "FranchiseMonthlyPerformance_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_originalTripId_fkey" FOREIGN KEY ("originalTripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_pickupDriverId_fkey" FOREIGN KEY ("pickupDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReassignment" ADD CONSTRAINT "TripReassignment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReschedule" ADD CONSTRAINT "TripReschedule_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPayroll" ADD CONSTRAINT "DriverPayroll_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPayroll" ADD CONSTRAINT "DriverPayroll_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
