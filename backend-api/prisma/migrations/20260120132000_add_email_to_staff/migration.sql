-- AlterTable: Add email field to Staff
ALTER TABLE "Staff" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- Update existing rows (if any) - set a temporary email based on phone
-- This is a safety measure, but ideally there should be no existing rows
UPDATE "Staff" SET "email" = 'staff_' || "id" || '@drybros.com' WHERE "email" = '';

-- Now make email required (remove default)
ALTER TABLE "Staff" ALTER COLUMN "email" DROP DEFAULT;
