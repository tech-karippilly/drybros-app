-- Add customerId to Complaint to track complaints raised by customers
ALTER TABLE "Complaint" ADD COLUMN "customerId" UUID;

-- Add foreign key constraint
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_customerId_fkey" 
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for customer lookups
CREATE INDEX "Complaint_customerId_idx" ON "Complaint"("customerId");
