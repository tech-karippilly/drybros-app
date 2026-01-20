-- CreateEnum
CREATE TYPE "CarType" AS ENUM ('MANUAL', 'AUTOMATIC', 'PREMIUM_CARS', 'LUXURY_CARS', 'SPORTY_CARS');

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "email" TEXT;
ALTER TABLE "Driver" ADD COLUMN "driverCode" TEXT;
ALTER TABLE "Driver" ADD COLUMN "password" TEXT;
ALTER TABLE "Driver" ADD COLUMN "emergencyContactName" TEXT;
ALTER TABLE "Driver" ADD COLUMN "emergencyContactPhone" TEXT;
ALTER TABLE "Driver" ADD COLUMN "emergencyContactRelation" TEXT;
ALTER TABLE "Driver" ADD COLUMN "address" TEXT;
ALTER TABLE "Driver" ADD COLUMN "city" TEXT;
ALTER TABLE "Driver" ADD COLUMN "state" TEXT;
ALTER TABLE "Driver" ADD COLUMN "pincode" TEXT;
ALTER TABLE "Driver" ADD COLUMN "licenseNumber" TEXT;
ALTER TABLE "Driver" ADD COLUMN "licenseExpDate" TIMESTAMP(3);
ALTER TABLE "Driver" ADD COLUMN "bankAccountName" TEXT;
ALTER TABLE "Driver" ADD COLUMN "bankAccountNumber" TEXT;
ALTER TABLE "Driver" ADD COLUMN "bankIfscCode" TEXT;
ALTER TABLE "Driver" ADD COLUMN "aadharCard" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Driver" ADD COLUMN "license" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Driver" ADD COLUMN "educationCert" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Driver" ADD COLUMN "previousExp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Driver" ADD COLUMN "carTypes" TEXT;
ALTER TABLE "Driver" ADD COLUMN "createdBy" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Driver_email_key" ON "Driver"("email");
CREATE UNIQUE INDEX "Driver_driverCode_key" ON "Driver"("driverCode");

-- Note: Foreign key constraint for createdBy is not added due to type mismatch
-- The createdBy field stores the User ID but without a foreign key constraint
-- This can be added later if User model is updated to match
