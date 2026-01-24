-- Add specialPrice flag to TripTypeConfig
ALTER TABLE "TripTypeConfig" ADD COLUMN IF NOT EXISTS "specialPrice" BOOLEAN NOT NULL DEFAULT false;

-- Make basePrice nullable (for specialPrice trip types)
ALTER TABLE "TripTypeConfig" ALTER COLUMN "basePrice" DROP NOT NULL;

-- Make extraPerHour nullable (for specialPrice trip types)
ALTER TABLE "TripTypeConfig" ALTER COLUMN "extraPerHour" DROP NOT NULL;
ALTER TABLE "TripTypeConfig" ALTER COLUMN "extraPerHour" DROP DEFAULT;
