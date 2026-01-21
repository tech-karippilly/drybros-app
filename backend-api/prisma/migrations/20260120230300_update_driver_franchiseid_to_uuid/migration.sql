-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, update Franchise table to use UUID if it's still using Int
-- Drop existing foreign key constraints that reference Franchise
ALTER TABLE "Driver" DROP CONSTRAINT IF EXISTS "Driver_franchiseId_fkey";
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_franchiseId_fkey";
ALTER TABLE "Trip" DROP CONSTRAINT IF EXISTS "Trip_franchiseId_fkey";

-- Convert Franchise.id from Int to UUID
DO $$ 
BEGIN
  -- Check if Franchise.id is already UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Franchise' 
    AND column_name = 'id' 
    AND data_type = 'integer'
  ) THEN
    -- Add new UUID column
    ALTER TABLE "Franchise" ADD COLUMN "id_new" UUID DEFAULT uuid_generate_v4();
    UPDATE "Franchise" SET "id_new" = uuid_generate_v4();
    
    -- Drop old primary key and column
    ALTER TABLE "Franchise" DROP CONSTRAINT "Franchise_pkey";
    ALTER TABLE "Franchise" DROP COLUMN "id";
    ALTER TABLE "Franchise" RENAME COLUMN "id_new" TO "id";
    ALTER TABLE "Franchise" ADD CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

-- Change Driver.franchiseId to UUID (set to NULL for now, will need manual update)
ALTER TABLE "Driver" ALTER COLUMN "franchiseId" TYPE UUID USING NULL;

-- Change Customer.franchiseId to UUID (set to NULL for now, will need manual update)
ALTER TABLE "Customer" ALTER COLUMN "franchiseId" TYPE UUID USING NULL;

-- Change Trip.franchiseId to UUID (set to NULL for now, will need manual update)
ALTER TABLE "Trip" ALTER COLUMN "franchiseId" TYPE UUID USING NULL;

-- Re-add foreign key constraints (commented out for now to allow dummy UUIDs)
-- ALTER TABLE "Driver" ADD CONSTRAINT "Driver_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "Customer" ADD CONSTRAINT "Customer_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "Trip" ADD CONSTRAINT "Trip_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- TODO: Uncomment these constraints when franchises are properly set up
