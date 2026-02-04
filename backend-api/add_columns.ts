import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Franchise" ADD COLUMN IF NOT EXISTS "workStartTime" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Franchise" ADD COLUMN IF NOT EXISTS "workEndTime" TEXT;`);
    console.log("Columns added successfully or already exist");
  } catch (e) {
    console.error("Error adding columns:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
