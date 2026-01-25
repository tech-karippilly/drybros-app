-- Add userId column to Attendance table for managers
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "userId" UUID;

-- Add loginTime column to Attendance table
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "loginTime" TIMESTAMP(3);

-- Add foreign key constraint for userId
DO $$ BEGIN
    ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create unique constraint for userId and date
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_userId_date_key" ON "Attendance"("userId", "date") WHERE "userId" IS NOT NULL;

-- Create index for userId and date
CREATE INDEX IF NOT EXISTS "Attendance_userId_date_idx" ON "Attendance"("userId", "date") WHERE "userId" IS NOT NULL;
