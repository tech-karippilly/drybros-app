-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add new UUID column
ALTER TABLE "Role" ADD COLUMN "id_new" UUID DEFAULT uuid_generate_v4();

-- Generate UUIDs for existing rows
UPDATE "Role" SET "id_new" = uuid_generate_v4();

-- Drop the old primary key constraint
ALTER TABLE "Role" DROP CONSTRAINT "Role_pkey";

-- Drop the old id column
ALTER TABLE "Role" DROP COLUMN "id";

-- Rename the new column to id
ALTER TABLE "Role" RENAME COLUMN "id_new" TO "id";

-- Add primary key constraint on new UUID column
ALTER TABLE "Role" ADD CONSTRAINT "Role_pkey" PRIMARY KEY ("id");

-- Drop the sequence (no longer needed)
DROP SEQUENCE IF EXISTS "Role_id_seq";
