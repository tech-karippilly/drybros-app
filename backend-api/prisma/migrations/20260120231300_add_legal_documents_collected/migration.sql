-- Add legalDocumentsCollected field to Franchise table
ALTER TABLE "Franchise" ADD COLUMN "legalDocumentsCollected" BOOLEAN NOT NULL DEFAULT false;
