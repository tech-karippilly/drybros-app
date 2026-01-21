-- AlterTable: Change createdBy from INTEGER to UUID to match User.id
ALTER TABLE "Driver" ALTER COLUMN "createdBy" TYPE UUID USING NULL;
-- Note: All existing createdBy values will be set to NULL since we can't convert Int to UUID
-- This is acceptable as it's a new field
