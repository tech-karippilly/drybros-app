/*
  Warnings:

  - You are about to drop the column `description` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `distanceScopeId` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `pricingMode` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `tripPatternId` on the `TripTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the `CarTypePricing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DistanceScope` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TripPattern` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[type,carCategory]` on the table `TripTypeConfig` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `baseAmount` to the `TripTypeConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `carCategory` to the `TripTypeConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `TripTypeConfig` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TripPricingType" AS ENUM ('DISTANCE', 'TIME', 'SLAB');

-- DropForeignKey
ALTER TABLE "CarTypePricing" DROP CONSTRAINT "CarTypePricing_tripTypeConfigId_fkey";

-- DropForeignKey
ALTER TABLE "TripTypeConfig" DROP CONSTRAINT "TripTypeConfig_distanceScopeId_fkey";

-- DropForeignKey
ALTER TABLE "TripTypeConfig" DROP CONSTRAINT "TripTypeConfig_tripPatternId_fkey";

-- DropIndex
DROP INDEX "TripTypeConfig_name_key";

-- AlterTable
ALTER TABLE "TripTypeConfig" DROP COLUMN "description",
DROP COLUMN "distanceScopeId",
DROP COLUMN "name",
DROP COLUMN "pricingMode",
DROP COLUMN "status",
DROP COLUMN "tripPatternId",
ADD COLUMN     "baseAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "carCategory" "CarCategory" NOT NULL,
ADD COLUMN     "distanceSlab" JSONB,
ADD COLUMN     "extraPerDistance" DOUBLE PRECISION,
ADD COLUMN     "timeSlab" JSONB,
ADD COLUMN     "type" "TripPricingType" NOT NULL;

-- DropTable
DROP TABLE "CarTypePricing";

-- DropTable
DROP TABLE "DistanceScope";

-- DropTable
DROP TABLE "TripPattern";

-- DropEnum
DROP TYPE "CarType";

-- DropEnum
DROP TYPE "DistanceScopeStatus";

-- DropEnum
DROP TYPE "PricingMode";

-- DropEnum
DROP TYPE "TripPatternStatus";

-- DropEnum
DROP TYPE "TripTypeConfigStatus";

-- CreateIndex
CREATE INDEX "TripTypeConfig_type_idx" ON "TripTypeConfig"("type");

-- CreateIndex
CREATE INDEX "TripTypeConfig_carCategory_idx" ON "TripTypeConfig"("carCategory");

-- CreateIndex
CREATE UNIQUE INDEX "TripTypeConfig_type_carCategory_key" ON "TripTypeConfig"("type", "carCategory");
