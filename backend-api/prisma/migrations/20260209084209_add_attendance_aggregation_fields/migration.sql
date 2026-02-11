-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'PARTIAL';

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "firstOnlineAt" TIMESTAMP(3),
ADD COLUMN     "lastOfflineAt" TIMESTAMP(3),
ADD COLUMN     "totalOnlineMinutes" INTEGER,
ADD COLUMN     "tripsCompleted" INTEGER NOT NULL DEFAULT 0;
