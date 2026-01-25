-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop foreign key constraint that references Customer.id
ALTER TABLE "Trip" DROP CONSTRAINT IF EXISTS "Trip_customerId_fkey";

-- Add new UUID column to Customer and populate
ALTER TABLE "Customer" ADD COLUMN "id_new" UUID DEFAULT uuid_generate_v4();
UPDATE "Customer" SET "id_new" = uuid_generate_v4();

-- Add new UUID column to Trip and populate from Customer mapping (preserve existing links)
ALTER TABLE "Trip" ADD COLUMN "customerId_new" UUID;
UPDATE "Trip" t
SET "customerId_new" = c."id_new"
FROM "Customer" c
WHERE t."customerId" = c."id" AND t."customerId" IS NOT NULL;

-- Drop old Trip.customerId and rename new column
ALTER TABLE "Trip" DROP COLUMN "customerId";
ALTER TABLE "Trip" RENAME COLUMN "customerId_new" TO "customerId";

-- Drop old Customer PK and id, rename id_new to id
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_pkey";
ALTER TABLE "Customer" DROP COLUMN "id";
ALTER TABLE "Customer" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_pkey" PRIMARY KEY ("id");

-- Re-add foreign key constraint
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
