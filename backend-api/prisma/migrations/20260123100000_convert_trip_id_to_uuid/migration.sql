-- Convert Trip.id from SERIAL (int) to UUID.
-- This must run before migrations that add UUID foreign keys referencing Trip.id.

-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add new UUID column and populate
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "id_new" UUID DEFAULT uuid_generate_v4();
UPDATE "Trip" SET "id_new" = uuid_generate_v4() WHERE "id_new" IS NULL;

-- Replace primary key
ALTER TABLE "Trip" DROP CONSTRAINT IF EXISTS "Trip_pkey";
ALTER TABLE "Trip" DROP COLUMN IF EXISTS "id" CASCADE;
ALTER TABLE "Trip" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_pkey" PRIMARY KEY ("id");

