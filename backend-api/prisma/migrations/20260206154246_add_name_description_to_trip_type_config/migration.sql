/*
  Warnings:

  - Added the required column `name` to the `TripTypeConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TripTypeConfig" ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;
