// scripts/verify-empty-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyEmptyDb() {
  console.log('🔍 Verifying database is empty...');
  
  try {
    // Count records in some key tables
    const franchiseCount = await prisma.franchise.count();
    console.log(`🏢 Franchises: ${franchiseCount}`);
    
    const driverCount = await prisma.driver.count();
    console.log(`🚗 Drivers: ${driverCount}`);
    
    const staffCount = await prisma.staff.count();
    console.log(`👥 Staff: ${staffCount}`);
    
    const tripCount = await prisma.trip.count();
    console.log(`🚕 Trips: ${tripCount}`);
    
    const customerCount = await prisma.customer.count();
    console.log(`👤 Customers: ${customerCount}`);
    
    const userCount = await prisma.user.count();
    console.log(`🔑 Users: ${userCount}`);
    
    const complaintCount = await prisma.complaint.count();
    console.log(`📝 Complaints: ${complaintCount}`);
    
    const attendanceCount = await prisma.attendance.count();
    console.log(`📅 Attendances: ${attendanceCount}`);
    
    const leaveRequestCount = await prisma.leaveRequest.count();
    console.log(`🏖️  Leave Requests: ${leaveRequestCount}`);
    
    const penaltyCount = await prisma.penalty.count();
    console.log(`💰 Penalties: ${penaltyCount}`);
    
    console.log('\n✅ Verification complete!');
    
    if (
      franchiseCount === 0 &&
      driverCount === 0 &&
      staffCount === 0 &&
      tripCount === 0 &&
      customerCount === 0 &&
      userCount === 0 &&
      complaintCount === 0 &&
      attendanceCount === 0 &&
      leaveRequestCount === 0 &&
      penaltyCount === 0
    ) {
      console.log('🎉 All tables are empty! Database successfully cleared.');
    } else {
      console.log('❌ Some tables still have records. Database not completely cleared.');
    }
  } catch (error) {
    console.error('❌ Error verifying database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyEmptyDb();