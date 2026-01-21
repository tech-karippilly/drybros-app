-- Add FranchiseStatus enum
CREATE TYPE "FranchiseStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'TEMPORARILY_CLOSED');

-- Add status column to Franchise table
ALTER TABLE "Franchise" ADD COLUMN "status" "FranchiseStatus" NOT NULL DEFAULT 'ACTIVE';
