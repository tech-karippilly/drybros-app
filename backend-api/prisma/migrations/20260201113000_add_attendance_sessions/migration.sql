-- Create AttendanceSession table to support multiple clock-in/out sessions per day
CREATE TABLE IF NOT EXISTS "AttendanceSession" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "attendanceId" UUID NOT NULL,
  "clockIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clockOut" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- Foreign key to Attendance
DO $$ BEGIN
  ALTER TABLE "AttendanceSession"
  ADD CONSTRAINT "AttendanceSession_attendanceId_fkey"
  FOREIGN KEY ("attendanceId")
  REFERENCES "Attendance"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS "AttendanceSession_attendanceId_clockIn_idx"
  ON "AttendanceSession"("attendanceId", "clockIn");

CREATE INDEX IF NOT EXISTS "AttendanceSession_attendanceId_clockOut_idx"
  ON "AttendanceSession"("attendanceId", "clockOut");

