-- CreateEnum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "PenaltyType" AS ENUM ('PENALTY', 'DEDUCTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Penalty" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "type" "PenaltyType" NOT NULL DEFAULT 'PENALTY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Penalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DriverPenalty" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "driverId" UUID NOT NULL,
    "penaltyId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "violationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedBy" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverPenalty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Penalty_isActive_idx" ON "Penalty"("isActive");
CREATE INDEX IF NOT EXISTS "Penalty_type_idx" ON "Penalty"("type");
CREATE INDEX IF NOT EXISTS "DriverPenalty_driverId_appliedAt_idx" ON "DriverPenalty"("driverId", "appliedAt");
CREATE INDEX IF NOT EXISTS "DriverPenalty_penaltyId_idx" ON "DriverPenalty"("penaltyId");
CREATE INDEX IF NOT EXISTS "DriverPenalty_appliedAt_idx" ON "DriverPenalty"("appliedAt");
CREATE INDEX IF NOT EXISTS "DriverPenalty_violationDate_idx" ON "DriverPenalty"("violationDate");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "DriverPenalty" ADD CONSTRAINT "DriverPenalty_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DriverPenalty" ADD CONSTRAINT "DriverPenalty_penaltyId_fkey" FOREIGN KEY ("penaltyId") REFERENCES "Penalty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DriverPenalty" ADD CONSTRAINT "DriverPenalty_appliedBy_fkey" FOREIGN KEY ("appliedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
