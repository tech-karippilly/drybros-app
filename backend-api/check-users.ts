import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking existing users...');
  
  // Check staff users
  const staffUsers = await prisma.staff.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      status: true,
    }
  });
  
  console.log('Staff users:');
  console.log(staffUsers);
  
  // Check driver users
  const driverUsers = await prisma.driver.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      status: true,
    }
  });
  
  console.log('Driver users:');
  console.log(driverUsers);
  
  // Check if there are any trip types
  const tripTypes = await prisma.tripTypeConfig.findMany();
  console.log('Trip types:');
  console.log(tripTypes);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });