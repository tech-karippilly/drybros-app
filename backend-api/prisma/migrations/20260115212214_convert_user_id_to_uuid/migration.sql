-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add new UUID column
ALTER TABLE "User" ADD COLUMN "id_new" UUID DEFAULT uuid_generate_v4();

-- Generate UUIDs for existing rows
UPDATE "User" SET "id_new" = uuid_generate_v4();

-- Drop the old primary key constraint
ALTER TABLE "User" DROP CONSTRAINT "User_pkey";

-- Drop the old id column
ALTER TABLE "User" DROP COLUMN "id";

-- Rename the new column to id
ALTER TABLE "User" RENAME COLUMN "id_new" TO "id";

-- Add primary key constraint on new UUID column
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- Drop the sequence (no longer needed)
DROP SEQUENCE IF EXISTS "User_id_seq";
