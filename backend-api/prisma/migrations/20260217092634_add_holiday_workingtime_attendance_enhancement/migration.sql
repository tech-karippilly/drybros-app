-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('PUBLIC', 'COMPANY', 'OPTIONAL');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "earlyDepartureMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lateByMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "logoutTime" TIMESTAMP(3),
ADD COLUMN     "lunchBreakEnd" TIMESTAMP(3),
ADD COLUMN     "lunchBreakStart" TIMESTAMP(3),
ADD COLUMN     "snackBreakEnd" TIMESTAMP(3),
ADD COLUMN     "snackBreakStart" TIMESTAMP(3),
ADD COLUMN     "totalWorkMinutes" INTEGER;

-- CreateTable
CREATE TABLE "Holiday" (
    "id" UUID NOT NULL,
    "franchiseId" UUID,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "HolidayType" NOT NULL DEFAULT 'PUBLIC',
    "description" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingTimeConfig" (
    "id" UUID NOT NULL,
    "franchiseId" UUID NOT NULL,
    "roleType" TEXT NOT NULL,
    "minimumWorkHours" INTEGER NOT NULL DEFAULT 8,
    "lunchBreakMinutes" INTEGER NOT NULL DEFAULT 60,
    "snackBreakMinutes" INTEGER NOT NULL DEFAULT 15,
    "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkingTimeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- CreateIndex
CREATE INDEX "Holiday_franchiseId_idx" ON "Holiday"("franchiseId");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_franchiseId_date_key" ON "Holiday"("franchiseId", "date");

-- CreateIndex
CREATE INDEX "WorkingTimeConfig_franchiseId_idx" ON "WorkingTimeConfig"("franchiseId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingTimeConfig_franchiseId_roleType_key" ON "WorkingTimeConfig"("franchiseId", "roleType");

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingTimeConfig" ADD CONSTRAINT "WorkingTimeConfig_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingTimeConfig" ADD CONSTRAINT "WorkingTimeConfig_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
