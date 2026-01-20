-- CreateIndex: Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS "Staff_franchiseId_status_idx" ON "Staff"("franchiseId", "status");
CREATE INDEX IF NOT EXISTS "Staff_franchiseId_isActive_idx" ON "Staff"("franchiseId", "isActive");
