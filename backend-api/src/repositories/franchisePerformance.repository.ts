// src/repositories/franchisePerformance.repository.ts
import prisma from "../config/prismaClient";

/**
 * Get total trips count for a franchise
 */
export async function getTotalTripsByFranchise(franchiseId: string): Promise<number> {
  return prisma.trip.count({
    where: {
      franchiseId,
    },
  });
}

/**
 * Get total reviews count for a franchise
 */
export async function getTotalReviewsByFranchise(franchiseId: string): Promise<number> {
  return prisma.tripReview.count({
    where: {
      franchiseId,
    },
  });
}

/**
 * Get active customers count for a franchise
 * Active customer = has placed trips in 3 or more different months
 */
export async function getActiveCustomersCountByFranchise(franchiseId: string): Promise<number> {
  // Query to get all trips with customer ID and trip date for the franchise
  const trips = await prisma.trip.findMany({
    where: {
      franchiseId,
      customerId: { not: null },
    },
    select: {
      customerId: true,
      tripPlacedDate: true,
    },
  });

  // Group by customer and count distinct months
  const customerMonthsMap = new Map<string, Set<string>>();

  trips.forEach((trip) => {
    if (!trip.customerId) return;

    // Create a unique month key (YYYY-MM format)
    const monthKey = `${trip.tripPlacedDate.getFullYear()}-${String(trip.tripPlacedDate.getMonth() + 1).padStart(2, "0")}`;

    if (!customerMonthsMap.has(trip.customerId)) {
      customerMonthsMap.set(trip.customerId, new Set());
    }

    customerMonthsMap.get(trip.customerId)!.add(monthKey);
  });

  // Count customers with 3 or more distinct months
  let activeCustomersCount = 0;
  customerMonthsMap.forEach((monthsSet) => {
    if (monthsSet.size >= 3) {
      activeCustomersCount++;
    }
  });

  return activeCustomersCount;
}
