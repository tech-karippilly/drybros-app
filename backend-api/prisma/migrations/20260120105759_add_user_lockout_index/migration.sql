-- CreateIndex for better query performance on lockedUntil field
-- This helps with queries that check account lockout status
CREATE INDEX IF NOT EXISTS "User_lockedUntil_idx" ON "User"("lockedUntil");
