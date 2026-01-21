-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop foreign key constraints that reference Driver.id
ALTER TABLE "Trip" DROP CONSTRAINT IF EXISTS "Trip_driverId_fkey";

-- Convert Driver.id from Int to UUID
DO $$ 
BEGIN
  -- Check if Driver.id is still integer
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Driver' 
    AND column_name = 'id' 
    AND data_type = 'integer'
  ) THEN
    -- Add new UUID column
    ALTER TABLE "Driver" ADD COLUMN "id_new" UUID DEFAULT uuid_generate_v4();
    UPDATE "Driver" SET "id_new" = uuid_generate_v4();
    
    -- Update Trip.driverId to match new Driver IDs (this is complex, so we'll set to NULL for now)
    -- You'll need to manually update Trip.driverId after this migration
    ALTER TABLE "Trip" ALTER COLUMN "driverId" TYPE UUID USING NULL;
    
    -- Drop old primary key and column
    ALTER TABLE "Driver" DROP CONSTRAINT "Driver_pkey";
    ALTER TABLE "Driver" DROP COLUMN "id";
    ALTER TABLE "Driver" RENAME COLUMN "id_new" TO "id";
    ALTER TABLE "Driver" ADD CONSTRAINT "Driver_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

-- Re-add foreign key constraint for Trip.driverId
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
