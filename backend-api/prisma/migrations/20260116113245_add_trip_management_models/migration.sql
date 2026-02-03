-- CreateEnum
CREATE TYPE "DistanceScopeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TripPatternStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TripTypeConfigStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "DistanceScope" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "DistanceScopeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistanceScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPattern" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "TripPatternStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "TripPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripTypeConfig" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "distanceScopeId" UUID NOT NULL,
    "tripPatternId" UUID NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "basePricePerHour" DOUBLE PRECISION,
    "baseDuration" DOUBLE PRECISION,
    "baseDistance" DOUBLE PRECISION,
    "extraPerHour" DOUBLE PRECISION NOT NULL,
    "extraPerHalfHour" DOUBLE PRECISION,
    "extraPerKm" DOUBLE PRECISION,
    "premiumCarMultiplier" DOUBLE PRECISION,
    "forPremiumCars" JSONB,
    "distanceSlabs" JSONB,
    "status" "TripTypeConfigStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripTypeConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TripTypeConfig" ADD CONSTRAINT "TripTypeConfig_distanceScopeId_fkey" FOREIGN KEY ("distanceScopeId") REFERENCES "DistanceScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTypeConfig" ADD CONSTRAINT "TripTypeConfig_tripPatternId_fkey" FOREIGN KEY ("tripPatternId") REFERENCES "TripPattern"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
