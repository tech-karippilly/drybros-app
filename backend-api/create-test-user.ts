import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test admin user...');
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@test.com' }
  });
  
  if (existingUser) {
    console.log('Admin user already exists');
    return;
  }
  
  // Create a test admin user
  const password = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: password,
      fullName: 'Test Admin',
      role: 'ADMIN',
      phone: '+919876543210',
      isActive: true,
    }
  });
  
  console.log('Created admin user:', user);
  
  // Test the API
  console.log('Testing API call to get trip type by ID...');
  const tripType = await prisma.tripTypeConfig.findFirst();
  console.log('Trip type found:', tripType);
  
  if (tripType) {
    console.log('Trip type data structure:');
    console.log('id:', tripType.id);
    console.log('name:', tripType.name);
    console.log('type:', tripType.type);
    console.log('carCategory:', tripType.carCategory);
    console.log('baseAmount:', tripType.baseAmount);
    console.log('createdAt:', tripType.createdAt);
    console.log('updatedAt:', tripType.updatedAt);
    console.log('typeof createdAt:', typeof tripType.createdAt);
    console.log('createdAt instanceof Date:', tripType.createdAt instanceof Date);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });