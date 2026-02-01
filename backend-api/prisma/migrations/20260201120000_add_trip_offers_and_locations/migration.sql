-- Add live driver location fields + trip pickup/drop coordinates
-- Add TripOffer table for real-time dispatch offers

-- CreateEnum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "TripOfferStatus" AS ENUM ('OFFERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Driver
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "currentLat" DOUBLE PRECISION;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "currentLng" DOUBLE PRECISION;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "locationAccuracyM" DOUBLE PRECISION;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "locationUpdatedAt" TIMESTAMP(3);

-- AlterTable: Trip
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "pickupLat" DOUBLE PRECISION;
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "pickupLng" DOUBLE PRECISION;
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "dropLat" DOUBLE PRECISION;
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "dropLng" DOUBLE PRECISION;

-- CreateTable: TripOffer
CREATE TABLE IF NOT EXISTS "TripOffer" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tripId" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "status" "TripOfferStatus" NOT NULL DEFAULT 'OFFERED',
    "offeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripOffer_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "TripOffer_tripId_driverId_key" ON "TripOffer"("tripId", "driverId");
CREATE INDEX IF NOT EXISTS "TripOffer_driverId_status_expiresAt_idx" ON "TripOffer"("driverId", "status", "expiresAt");
CREATE INDEX IF NOT EXISTS "TripOffer_tripId_status_idx" ON "TripOffer"("tripId", "status");
CREATE INDEX IF NOT EXISTS "TripOffer_expiresAt_idx" ON "TripOffer"("expiresAt");

-- Foreign keys
DO $$ BEGIN
    ALTER TABLE "TripOffer" ADD CONSTRAINT "TripOffer_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "TripOffer" ADD CONSTRAINT "TripOffer_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

