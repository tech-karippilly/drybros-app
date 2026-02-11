import { PrismaClient, PenaltyTriggerType, PenaltyCategory, PenaltySeverity } from '@prisma/client';

const prisma = new PrismaClient();

const defaultPenalties = [
  {
    name: 'Late Report',
    description: 'Trip started more than 5 minutes after scheduled time',
    amount: 100,
    type: 'PENALTY' as const,
    isAutomatic: true,
    triggerType: 'LATE_REPORT' as PenaltyTriggerType,
    triggerConfig: { delayMinutes: 5 },
    category: 'OPERATIONAL' as PenaltyCategory,
    severity: 'MEDIUM' as PenaltySeverity,
    notifyAdmin: true,
    notifyManager: true,
    notifyDriver: false,
    blockDriver: false,
  },
  {
    name: 'Three Complaints Block',
    description: 'Driver automatically blocked after receiving 3 complaints',
    amount: 0,
    type: 'PENALTY' as const,
    isAutomatic: true,
    triggerType: 'THREE_COMPLAINTS' as PenaltyTriggerType,
    triggerConfig: { complaintCount: 3 },
    category: 'BEHAVIORAL' as PenaltyCategory,
    severity: 'HIGH' as PenaltySeverity,
    notifyAdmin: true,
    notifyManager: true,
    notifyDriver: true,
    blockDriver: true,
  },
  {
    name: 'Trip Cancelled by Driver',
    description: 'Driver cancelled assigned trip without valid reason',
    amount: 200,
    type: 'PENALTY' as const,
    isAutomatic: false,
    triggerType: 'CANCELLED_TRIP' as PenaltyTriggerType,
    triggerConfig: {},
    category: 'OPERATIONAL' as PenaltyCategory,
    severity: 'MEDIUM' as PenaltySeverity,
    notifyAdmin: false,
    notifyManager: true,
    notifyDriver: true,
    blockDriver: false,
  },
  {
    name: 'Phone Not Answered',
    description: 'Driver did not answer phone when customer or office called',
    amount: 50,
    type: 'PENALTY' as const,
    isAutomatic: false,
    triggerType: 'PHONE_NOT_ANSWERED' as PenaltyTriggerType,
    triggerConfig: {},
    category: 'BEHAVIORAL' as PenaltyCategory,
    severity: 'LOW' as PenaltySeverity,
    notifyAdmin: false,
    notifyManager: true,
    notifyDriver: true,
    blockDriver: false,
  },
  {
    name: 'Dress Code Violation',
    description: 'Driver not wearing proper uniform or appearance standards not met',
    amount: 100,
    type: 'PENALTY' as const,
    isAutomatic: false,
    triggerType: 'DRESS_CODE_VIOLATION' as PenaltyTriggerType,
    triggerConfig: {},
    category: 'BEHAVIORAL' as PenaltyCategory,
    severity: 'LOW' as PenaltySeverity,
    notifyAdmin: false,
    notifyManager: true,
    notifyDriver: true,
    blockDriver: false,
  },
  {
    name: 'Customer Complaint',
    description: 'Customer filed formal complaint against driver',
    amount: 150,
    type: 'PENALTY' as const,
    isAutomatic: false,
    triggerType: 'CUSTOMER_COMPLAINT' as PenaltyTriggerType,
    triggerConfig: {},
    category: 'BEHAVIORAL' as PenaltyCategory,
    severity: 'MEDIUM' as PenaltySeverity,
    notifyAdmin: true,
    notifyManager: true,
    notifyDriver: true,
    blockDriver: false,
  },
];

async function seedDefaultPenalties() {
  console.log('🌱 Seeding default penalties...');

  try {
    for (const penalty of defaultPenalties) {
      const existing = await prisma.penalty.findFirst({
        where: { name: penalty.name },
      });

      if (existing) {
        console.log(`  ⏭️  Penalty "${penalty.name}" already exists, skipping...`);
        continue;
      }

      const created = await prisma.penalty.create({
        data: penalty,
      });

      console.log(`  ✅ Created penalty: ${created.name} (₹${created.amount})`);
    }

    console.log('✨ Default penalties seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding default penalties:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedDefaultPenalties()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedDefaultPenalties;
