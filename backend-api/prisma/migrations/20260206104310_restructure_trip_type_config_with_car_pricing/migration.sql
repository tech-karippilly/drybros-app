/*
  Warnings:

  - You are about to drop the column `baseDuration` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `basePrice` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `basePricePerHour` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `distanceSlabs` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `extraPerKm` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `forPremiumCars` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `premiumCarMultiplier` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `specialPrice` on the `TripTypeConfig` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `TripTypeConfig` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pricingMode` to the `TripTypeConfig` table without a default value. This is not possible if the table is not empty.

*/

-- Delete existing trip type configs (starting fresh with new structure)
DELETE FROM "TripTypeConfig";

-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('TIME_BASED', 'DISTANCE_BASED');

-- AlterTable
ALTER TABLE "TripTypeConfig" DROP COLUMN "baseDuration",
DROP COLUMN "basePrice",
DROP COLUMN "basePricePerHour",
DROP COLUMN "distanceSlabs",
DROP COLUMN "extraPerKm",
DROP COLUMN "forPremiumCars",
DROP COLUMN "premiumCarMultiplier",
DROP COLUMN "specialPrice",
ADD COLUMN     "baseHour" DOUBLE PRECISION,
ADD COLUMN     "pricingMode" "PricingMode" NOT NULL;

-- CreateTable
CREATE TABLE "CarTypePricing" (
    "id" UUID NOT NULL,
    "tripTypeConfigId" UUID NOT NULL,
    "carType" "CarType" NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "distanceSlabs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarTypePricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarTypePricing_tripTypeConfigId_idx" ON "CarTypePricing"("tripTypeConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "CarTypePricing_tripTypeConfigId_carType_key" ON "CarTypePricing"("tripTypeConfigId", "carType");

-- CreateIndex
CREATE UNIQUE INDEX "TripTypeConfig_name_key" ON "TripTypeConfig"("name");

-- AddForeignKey
ALTER TABLE "CarTypePricing" ADD CONSTRAINT "CarTypePricing_tripTypeConfigId_fkey" FOREIGN KEY ("tripTypeConfigId") REFERENCES "TripTypeConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

