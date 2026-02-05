-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'EV');

-- CreateEnum
CREATE TYPE "CarCategory" AS ENUM ('NORMAL', 'PREMIUM', 'LUXURY', 'SPORTS');

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "carCategories" "CarCategory"[] DEFAULT ARRAY[]::"CarCategory"[],
ADD COLUMN     "transmissionTypes" "TransmissionType"[] DEFAULT ARRAY[]::"TransmissionType"[];

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "driverSelfieUrl" TEXT,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "liveLocationLat" DOUBLE PRECISION,
ADD COLUMN     "liveLocationLng" DOUBLE PRECISION,
ADD COLUMN     "odometerEndImageUrl" TEXT,
ADD COLUMN     "odometerStartImageUrl" TEXT,
ADD COLUMN     "startTime" TIMESTAMP(3);
