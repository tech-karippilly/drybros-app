// scripts/seed-default-penalties.ts
/**
 * Script to seed default penalty deductions for drivers into the database
 * Run with: npx tsx scripts/seed-default-penalties.ts
 */

import { PrismaClient, PenaltyType } from "@prisma/client";
import { DRIVER_PENALTY_DEDUCTIONS } from "../src/constants/penalty";

const prisma = new PrismaClient();

async function seedDefaultPenalties() {
  console.log("🌱 Starting to seed default driver penalty deductions...");

  try {
    const penalties = Object.values(DRIVER_PENALTY_DEDUCTIONS);

    for (const penalty of penalties) {
      // Check if penalty already exists
      const existing = await prisma.penalty.findFirst({
        where: { name: penalty.name },
      });

      if (existing) {
        console.log(`⚠️  Penalty "${penalty.name}" already exists, skipping...`);
        continue;
      }

      // Create new penalty
      const created = await prisma.penalty.create({
        data: {
          name: penalty.name,
          description: penalty.description,
          amount: penalty.amount,
          type: PenaltyType.PENALTY,
          isActive: true,
        },
      });

      console.log(
        `✅ Created penalty: "${created.name}" - ₹${created.amount}`
      );
    }

    console.log("\n✨ Default penalties seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding penalties:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDefaultPenalties()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
