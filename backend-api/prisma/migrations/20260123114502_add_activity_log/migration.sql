-- CreateEnum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "ActivityAction" AS ENUM (
      'TRIP_CREATED', 'TRIP_ASSIGNED', 'TRIP_ACCEPTED', 'TRIP_REJECTED', 'TRIP_STARTED', 'TRIP_ENDED', 'TRIP_CANCELLED', 'TRIP_STATUS_CHANGED', 'TRIP_UPDATED',
      'DRIVER_CREATED', 'DRIVER_UPDATED', 'DRIVER_STATUS_CHANGED', 'DRIVER_CLOCK_IN', 'DRIVER_CLOCK_OUT',
      'STAFF_CREATED', 'STAFF_UPDATED', 'STAFF_STATUS_CHANGED', 'STAFF_CLOCK_IN', 'STAFF_CLOCK_OUT',
      'COMPLAINT_CREATED', 'COMPLAINT_RESOLVED', 'COMPLAINT_STATUS_CHANGED',
      'LEAVE_REQUESTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_CANCELLED',
      'RATING_SUBMITTED', 'ATTENDANCE_RECORDED',
      'CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'FRANCHISE_CREATED', 'FRANCHISE_UPDATED', 'FRANCHISE_STATUS_CHANGED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ActivityEntityType" AS ENUM ('TRIP', 'DRIVER', 'STAFF', 'CUSTOMER', 'FRANCHISE', 'COMPLAINT', 'LEAVE_REQUEST', 'RATING', 'ATTENDANCE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable - Add franchiseId to User for MANAGER role
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "franchiseId" UUID;

-- CreateIndex for User
CREATE INDEX IF NOT EXISTS "User_franchiseId_idx" ON "User"("franchiseId");
CREATE INDEX IF NOT EXISTS "User_role_franchiseId_idx" ON "User"("role", "franchiseId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "action" "ActivityAction" NOT NULL,
    "entityType" "ActivityEntityType" NOT NULL,
    "entityId" TEXT,
    "franchiseId" UUID,
    "driverId" UUID,
    "staffId" UUID,
    "tripId" UUID,
    "userId" UUID,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActivityLog_franchiseId_createdAt_idx" ON "ActivityLog"("franchiseId", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_driverId_createdAt_idx" ON "ActivityLog"("driverId", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_staffId_createdAt_idx" ON "ActivityLog"("staffId", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_tripId_createdAt_idx" ON "ActivityLog"("tripId", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "ActivityLog_action_createdAt_idx" ON "ActivityLog"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
