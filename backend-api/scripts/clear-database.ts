// scripts/clear-database.ts
import { PrismaClient } from '@prisma/client';

declare var process: {
  exit(code?: number): void;
};

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️  Starting to clear all database records...');
  
  // We need to delete records in the correct order to respect foreign key constraints
  // Start with tables that have no dependencies, then move to parent tables
  
  try {
    // Delete records with no dependencies first
    console.log('🧹 Deleting Password Reset OTPs...');
    await prisma.passwordResetOTP.deleteMany({});
    
    console.log('🧹 Deleting Activity Logs...');
    await prisma.activityLog.deleteMany({});
    
    console.log('🧹 Deleting Trip Status Histories...');
    await prisma.tripStatusHistory.deleteMany({});
    
    console.log('🧹 Deleting Trip Reviews...');
    await prisma.tripReview.deleteMany({});
    
    console.log('🧹 Deleting Driver Ratings...');
    await prisma.driverRating.deleteMany({});
    
    console.log('🧹 Deleting Driver Daily Metrics...');
    await prisma.driverDailyMetrics.deleteMany({});
    
    console.log('🧹 Deleting Trip Offers...');
    await prisma.tripOffer.deleteMany({});
    
    console.log('🧹 Deleting Trip Reassignments...');
    await prisma.tripReassignment.deleteMany({});
    
    console.log('🧹 Deleting Trip Reschedules...');
    await prisma.tripReschedule.deleteMany({});
    
    console.log('🧹 Deleting Pickup Requests...');
    await prisma.pickupRequest.deleteMany({});
    
    console.log('🧹 Deleting Driver Transactions...');
    await prisma.driverTransaction.deleteMany({});
    
    console.log('🧹 Deleting Driver Payrolls...');
    await prisma.driverPayroll.deleteMany({});
    
    console.log('🧹 Deleting Staff Monthly Performances...');
    await prisma.staffMonthlyPerformance.deleteMany({});
    
    console.log('🧹 Deleting Manager Monthly Performances...');
    await prisma.managerMonthlyPerformance.deleteMany({});
    
    console.log('🧹 Deleting Franchise Monthly Performances...');
    await prisma.franchiseMonthlyPerformance.deleteMany({});
    
    console.log('🧹 Deleting Driver Monthly Performances...');
    await prisma.driverMonthlyPerformance.deleteMany({});
    
    console.log('🧹 Deleting Attendance Sessions...');
    await prisma.attendanceSession.deleteMany({});
    
    console.log('🧹 Deleting Attendances...');
    await prisma.attendance.deleteMany({});
    
    console.log('🧹 Deleting Leave Requests...');
    await prisma.leaveRequest.deleteMany({});
    
    console.log('🧹 Deleting Complaints...');
    await prisma.complaint.deleteMany({});
    
    console.log('🧹 Deleting Warnings...');
    await prisma.warning.deleteMany({});
    
    console.log('🧹 Deleting Trip Types Config...');
    await prisma.tripTypeConfig.deleteMany({});
    
    console.log('🧹 Deleting Trips...');
    await prisma.trip.deleteMany({});
    
    console.log('🧹 Deleting Driver Cars...');
    await prisma.driverCar.deleteMany({});
    
    console.log('🧹 Deleting Driver Earnings Configs...');
    await prisma.driverEarningsConfig.deleteMany({});
    
    console.log('🧹 Deleting Penalties...');
    await prisma.penalty.deleteMany({});
    
    console.log('🧹 Deleting Holidays...');
    await prisma.holiday.deleteMany({});
    
    console.log('🧹 Deleting Working Time Configs...');
    await prisma.workingTimeConfig.deleteMany({});
    
    console.log('🧹 Deleting Staff History...');
    await prisma.staffHistory.deleteMany({});
    
    // Now delete parent tables
    console.log('🧹 Deleting Drivers...');
    await prisma.driver.deleteMany({});
    
    console.log('🧹 Deleting Staff...');
    await prisma.staff.deleteMany({});
    
    console.log('🧹 Deleting Customers...');
    await prisma.customer.deleteMany({});
    
    console.log('🧹 Deleting Users...');
    await prisma.user.deleteMany({});
    
    console.log('🧹 Deleting Franchises...');
    await prisma.franchise.deleteMany({});
    
    console.log('🧹 Deleting Roles...');
    await prisma.role.deleteMany({});
    
    console.log('✅ Database cleared successfully!');
    console.log('📊 All tables are now empty.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
clearDatabase();