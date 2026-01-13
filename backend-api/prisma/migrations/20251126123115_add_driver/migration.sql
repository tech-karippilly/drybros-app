-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'TERMINATED');

-- CreateTable
CREATE TABLE "Driver" (
    "id" SERIAL NOT NULL,
    "franchiseId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "altPhone" TEXT,
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "complaintCount" INTEGER NOT NULL DEFAULT 0,
    "bannedGlobally" BOOLEAN NOT NULL DEFAULT false,
    "dailyTargetAmount" INTEGER,
    "currentRating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phone_key" ON "Driver"("phone");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
