-- Add isActive field to Driver model for soft delete
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "Driver_isActive_idx" ON "Driver"("isActive");
