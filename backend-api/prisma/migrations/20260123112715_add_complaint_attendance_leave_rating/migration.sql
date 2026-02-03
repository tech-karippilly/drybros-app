-- CreateEnum (only if it doesn't exist)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Defensive: Ensure Trip.id is UUID if it's still integer
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Trip' AND column_name = 'id' AND data_type = 'integer') THEN
        ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "id_new" UUID DEFAULT uuid_generate_v4();
        UPDATE "Trip" SET "id_new" = uuid_generate_v4() WHERE "id_new" IS NULL;
        ALTER TABLE "Trip" DROP CONSTRAINT IF EXISTS "Trip_pkey";
        ALTER TABLE "Trip" DROP COLUMN IF EXISTS "id" CASCADE;
        ALTER TABLE "Trip" RENAME COLUMN "id_new" TO "id";
        ALTER TABLE "Trip" ADD CONSTRAINT "Trip_pkey" PRIMARY KEY ("id");
    END IF;
END $$;

DO $$ BEGIN
    CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ComplaintSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LeaveType" AS ENUM ('SICK_LEAVE', 'CASUAL_LEAVE', 'EARNED_LEAVE', 'EMERGENCY_LEAVE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "carImageBack" TEXT;
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "carImageFront" TEXT;
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "endOdometer" DOUBLE PRECISION;
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "startOdometer" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Complaint" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "driverId" UUID,
    "staffId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reportedBy" UUID,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "ComplaintSeverity" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" UUID,
    "resolution" TEXT,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "driverId" UUID,
    "staffId" UUID,
    "date" DATE NOT NULL,
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LeaveRequest" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "driverId" UUID,
    "staffId" UUID,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" UUID,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
DROP TABLE IF EXISTS "DriverRating" CASCADE;
CREATE TABLE IF NOT EXISTS "DriverRating" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "driverId" UUID NOT NULL,
    "tripId" UUID,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "overallRating" DOUBLE PRECISION NOT NULL,
    "experience" TEXT,
    "drivingSafety" DOUBLE PRECISION NOT NULL,
    "drivingSmoothness" DOUBLE PRECISION NOT NULL,
    "behaviorPoliteness" DOUBLE PRECISION NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Complaint_driverId_idx" ON "Complaint"("driverId");
CREATE INDEX IF NOT EXISTS "Complaint_staffId_idx" ON "Complaint"("staffId");
CREATE INDEX IF NOT EXISTS "Complaint_status_idx" ON "Complaint"("status");
CREATE INDEX IF NOT EXISTS "Complaint_createdAt_idx" ON "Complaint"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Attendance_date_idx" ON "Attendance"("date");
CREATE INDEX IF NOT EXISTS "Attendance_driverId_date_idx" ON "Attendance"("driverId", "date");
CREATE INDEX IF NOT EXISTS "Attendance_staffId_date_idx" ON "Attendance"("staffId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_driverId_date_key" ON "Attendance"("driverId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_staffId_date_key" ON "Attendance"("staffId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeaveRequest_driverId_idx" ON "LeaveRequest"("driverId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_staffId_idx" ON "LeaveRequest"("staffId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_status_idx" ON "LeaveRequest"("status");
CREATE INDEX IF NOT EXISTS "LeaveRequest_startDate_idx" ON "LeaveRequest"("startDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DriverRating_driverId_idx" ON "DriverRating"("driverId");
CREATE INDEX IF NOT EXISTS "DriverRating_tripId_idx" ON "DriverRating"("tripId");
CREATE INDEX IF NOT EXISTS "DriverRating_createdAt_idx" ON "DriverRating"("createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DriverRating" ADD CONSTRAINT "DriverRating_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DriverRating" ADD CONSTRAINT "DriverRating_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
