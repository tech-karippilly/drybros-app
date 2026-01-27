-- CreateEnum
CREATE TYPE "TripEventType" AS ENUM ('ARRIVED_ON_LOCATION', 'TRIP_INITIATED', 'TRIP_STARTED', 'TRIP_LOCATION_REACHED', 'TRIP_DESTINATION_REACHED', 'TRIP_END_INITIATED', 'TRIP_ENDED', 'TRIP_AMOUNT_COLLECTED', 'PAYMENT_COLLECTED', 'PAYMENT_SUBMITTED_TO_BRANCH', 'STATUS_CHANGED');

-- CreateTable
CREATE TABLE "DriverDailyMetrics" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "driverId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "numberOfTrips" INTEGER NOT NULL DEFAULT 0,
    "numberOfComplaints" INTEGER NOT NULL DEFAULT 0,
    "distanceTraveled" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tripAverageRating" DOUBLE PRECISION,
    "overallRating" DOUBLE PRECISION,
    "dailyLimit" DECIMAL(10,2),
    "remainingLimit" DECIMAL(10,2),
    "incentive" DECIMAL(10,2),
    "bonus" DECIMAL(10,2),
    "cashInHand" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cashSubmittedOnDate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDailyMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripStatusHistory" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tripId" UUID NOT NULL,
    "driverId" UUID,
    "eventType" "TripEventType" NOT NULL,
    "status" "TripStatus",
    "description" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "TripStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverDailyMetrics_driverId_date_key" ON "DriverDailyMetrics"("driverId", "date");

-- CreateIndex
CREATE INDEX "DriverDailyMetrics_driverId_date_idx" ON "DriverDailyMetrics"("driverId", "date");

-- CreateIndex
CREATE INDEX "DriverDailyMetrics_date_idx" ON "DriverDailyMetrics"("date");

-- CreateIndex
CREATE INDEX "TripStatusHistory_tripId_occurredAt_idx" ON "TripStatusHistory"("tripId", "occurredAt");

-- CreateIndex
CREATE INDEX "TripStatusHistory_driverId_occurredAt_idx" ON "TripStatusHistory"("driverId", "occurredAt");

-- CreateIndex
CREATE INDEX "TripStatusHistory_eventType_occurredAt_idx" ON "TripStatusHistory"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "TripStatusHistory_occurredAt_idx" ON "TripStatusHistory"("occurredAt");

-- AddForeignKey
ALTER TABLE "DriverDailyMetrics" ADD CONSTRAINT "DriverDailyMetrics_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStatusHistory" ADD CONSTRAINT "TripStatusHistory_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStatusHistory" ADD CONSTRAINT "TripStatusHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStatusHistory" ADD CONSTRAINT "TripStatusHistory_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
