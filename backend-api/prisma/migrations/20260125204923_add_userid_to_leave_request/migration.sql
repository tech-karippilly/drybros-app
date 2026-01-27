-- AlterTable: Add userId column to LeaveRequest
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "userId" UUID;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeaveRequest_userId_idx" ON "LeaveRequest"("userId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
