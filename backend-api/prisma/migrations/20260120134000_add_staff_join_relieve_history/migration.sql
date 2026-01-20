-- CreateEnum
CREATE TYPE "RelieveReason" AS ENUM ('RESIGNATION', 'TERMINATION', 'RETIREMENT', 'CONTRACT_ENDED', 'PERFORMANCE_ISSUES', 'MISCONDUCT', 'OTHER');

-- AlterTable: Add joinDate, relieveDate, and relieveReason to Staff
ALTER TABLE "Staff" ADD COLUMN "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Staff" ADD COLUMN "relieveDate" TIMESTAMP(3);
ALTER TABLE "Staff" ADD COLUMN "relieveReason" "RelieveReason";

-- CreateTable: StaffHistory
CREATE TABLE "StaffHistory" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "staffId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "changedBy" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffHistory_staffId_idx" ON "StaffHistory"("staffId");
CREATE INDEX "StaffHistory_createdAt_idx" ON "StaffHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "StaffHistory" ADD CONSTRAINT "StaffHistory_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
