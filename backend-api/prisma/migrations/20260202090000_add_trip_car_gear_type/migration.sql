-- Add Trip.carGearType to persist transmission/gear preference.
-- Backward compatible: existing rows remain NULL; API will fallback to parsing legacy Trip.carType JSON.

ALTER TABLE "Trip"
ADD COLUMN IF NOT EXISTS "carGearType" TEXT;

