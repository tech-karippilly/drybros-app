-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "lastStatusChange" TIMESTAMP(3),
ADD COLUMN     "onlineStatus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "lastStatusChange" TIMESTAMP(3),
ADD COLUMN     "onlineStatus" BOOLEAN NOT NULL DEFAULT false;
