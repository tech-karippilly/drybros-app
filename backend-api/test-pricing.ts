import { calculateTripPrice } from './src/services/pricing.service';
import prisma from './src/config/prismaClient';

async function testPricing() {
  console.log('Testing pricing calculation for CITY DROP trip...\n');
  
  const tripData = {
    tripType: 'CITY DROP' as any,
    distance: 9.5,
    duration: 2, // 2 hours
    carType: 'NORMAL' as any,
  };
  
  console.log('Input:', tripData);
  
  try {
    const result = await calculateTripPrice(tripData);
    console.log('\nResult:', JSON.stringify(result, null, 2));
    
    if (result.tripTypeConfig) {
      console.log('\n✓ Trip type config loaded successfully');
      console.log('Config details:', {
        name: result.tripTypeConfig.name,
        basePrice: result.tripTypeConfig.basePrice,
        baseDuration: result.tripTypeConfig.baseDuration,
        extraPerHour: result.tripTypeConfig.extraPerHour,
      });
    } else {
      console.log('\n✗ Trip type config is null');
    }
    
    if (result.totalPrice > 0) {
      console.log(`\n✓ Total price calculated: ₹${result.totalPrice}`);
    } else {
      console.log('\n✗ Total price is 0');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPricing();
