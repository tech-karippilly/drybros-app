-- Drop foreign key constraint to allow dummy UUIDs for franchiseId
ALTER TABLE "Driver" DROP CONSTRAINT IF EXISTS "Driver_franchiseId_fkey";
