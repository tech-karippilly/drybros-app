-- DropIndex
DROP INDEX "TripTypeConfig_type_carCategory_key";

-- CreateIndex
CREATE UNIQUE INDEX "TripTypeConfig_name_carCategory_key" ON "TripTypeConfig"("name", "carCategory");

-- CreateIndex
CREATE INDEX "TripTypeConfig_name_idx" ON "TripTypeConfig"("name");
