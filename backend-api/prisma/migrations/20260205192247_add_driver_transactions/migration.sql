-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "DriverTransactionType" AS ENUM ('PENALTY', 'TRIP');

-- AlterTable
ALTER TABLE "Penalty" ADD COLUMN     "driverId" UUID;

-- CreateTable
CREATE TABLE "DriverTransaction" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "tripId" UUID,
    "type" "DriverTransactionType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverTransaction_driverId_createdAt_idx" ON "DriverTransaction"("driverId", "createdAt");

-- CreateIndex
CREATE INDEX "DriverTransaction_transactionType_idx" ON "DriverTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "DriverTransaction_type_idx" ON "DriverTransaction"("type");

-- CreateIndex
CREATE INDEX "DriverTransaction_tripId_idx" ON "DriverTransaction"("tripId");

-- CreateIndex
CREATE INDEX "Penalty_driverId_idx" ON "Penalty"("driverId");

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTransaction" ADD CONSTRAINT "DriverTransaction_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTransaction" ADD CONSTRAINT "DriverTransaction_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
