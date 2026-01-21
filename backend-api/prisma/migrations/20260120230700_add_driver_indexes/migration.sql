-- Add indexes for frequently queried driver fields to improve query performance

-- Index for status filtering (used in pagination and listing)
CREATE INDEX IF NOT EXISTS "Driver_status_idx" ON "Driver"("status");

-- Index for isActive filtering (used in pagination and soft delete checks)
CREATE INDEX IF NOT EXISTS "Driver_isActive_idx" ON "Driver"("isActive");

-- Composite index for common query pattern: active drivers by status
CREATE INDEX IF NOT EXISTS "Driver_isActive_status_idx" ON "Driver"("isActive", "status");

-- Index for createdAt (used in pagination ordering)
CREATE INDEX IF NOT EXISTS "Driver_createdAt_idx" ON "Driver"("createdAt");

-- Index for franchiseId (used in filtering by franchise)
CREATE INDEX IF NOT EXISTS "Driver_franchiseId_idx" ON "Driver"("franchiseId");
