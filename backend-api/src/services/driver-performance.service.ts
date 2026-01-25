import prisma from "../config/prismaClient";
import { Driver } from "@prisma/client";
import {
  DRIVER_PERFORMANCE_CATEGORIES,
  PERFORMANCE_CALCULATION_CONFIG,
  DriverPerformanceCategory,
} from "../constants/driver";

export interface DriverPerformanceMetrics {
  category: DriverPerformanceCategory;
  score: number; // 0-100
  rating: number | null;
  complaintCount: number;
  totalTrips: number;
  completedTrips: number;
  rejectedTrips: number;
  completionRate: number; // percentage
  rejectionRate: number; // percentage
}

export interface DriverWithPerformance extends Driver {
  performance: DriverPerformanceMetrics;
}

/**
 * Calculate performance category for a driver
 */
export async function calculateDriverPerformance(
  driverId: string
): Promise<DriverPerformanceMetrics> {
  // Get driver with trips from performance window
  const performanceWindowDate = new Date(
    Date.now() - PERFORMANCE_CALCULATION_CONFIG.PERFORMANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      Trip: {
        where: {
          createdAt: {
            gte: performanceWindowDate,
          },
        },
      },
    },
  });

  if (!driver) {
    throw new Error("Driver not found");
  }

  const trips = driver.Trip;
  const totalTrips = trips.length;

  // Count completed trips
  const completedTrips = trips.filter(
    (trip) =>
      trip.status === "COMPLETED" ||
      trip.status === "TRIP_ENDED" ||
      trip.status === "PAYMENT_DONE"
  ).length;

  // Count rejected trips
  const rejectedTrips = trips.filter(
    (trip) => trip.status === "REJECTED_BY_DRIVER"
  ).length;

  // Calculate rates
  const completionRate =
    totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;
  const rejectionRate =
    totalTrips > 0 ? (rejectedTrips / totalTrips) * 100 : 0;

  // Get rating (default to 0 if null)
  const rating = driver.currentRating ?? 0;
  const complaintCount = driver.complaintCount;

  // Calculate performance score (0-100)
  let score = 0;

  // Rating component (40 points max)
  // 5.0 rating = 40 points, 4.0 = 32 points, 3.0 = 24 points, etc.
  score += rating * (PERFORMANCE_CALCULATION_CONFIG.RATING_WEIGHT / 5);

  // Completion rate component (30 points max)
  // 100% completion = 30 points
  score +=
    (completionRate / 100) *
    PERFORMANCE_CALCULATION_CONFIG.COMPLETION_RATE_WEIGHT;

  // Complaint component (20 points max, inverse)
  // 0 complaints = 20 points, 1 complaint = 16 points, 5+ complaints = 0 points
  const complaintPenalty =
    complaintCount * (PERFORMANCE_CALCULATION_CONFIG.COMPLAINT_WEIGHT / 5);
  score += Math.max(
    0,
    PERFORMANCE_CALCULATION_CONFIG.COMPLAINT_WEIGHT - complaintPenalty
  );

  // Rejection rate component (10 points max, inverse)
  // 0% rejection = 10 points, 10% rejection = 9 points, 50%+ rejection = 0 points
  const rejectionPenalty =
    (rejectionRate / 100) *
    PERFORMANCE_CALCULATION_CONFIG.REJECTION_RATE_WEIGHT *
    2;
  score += Math.max(
    0,
    PERFORMANCE_CALCULATION_CONFIG.REJECTION_RATE_WEIGHT - rejectionPenalty
  );

  // Cap score at 100
  score = Math.min(100, Math.max(0, score));

  // Determine category based on score
  let category: DriverPerformanceCategory = DRIVER_PERFORMANCE_CATEGORIES.YELLOW;

  // Override rules (strict criteria)
  // RED if: rating < 2.0 OR complaintCount >= 5 OR rejectionRate > 50%
  if (
    rating < PERFORMANCE_CALCULATION_CONFIG.RED_RATING_THRESHOLD ||
    complaintCount >= PERFORMANCE_CALCULATION_CONFIG.RED_COMPLAINT_THRESHOLD ||
    rejectionRate > PERFORMANCE_CALCULATION_CONFIG.RED_REJECTION_RATE_THRESHOLD
  ) {
    category = DRIVER_PERFORMANCE_CATEGORIES.RED;
  }
  // GREEN if: rating >= 4.5 AND complaintCount === 0 AND rejectionRate < 5% AND has enough trips
  else if (
    rating >= PERFORMANCE_CALCULATION_CONFIG.GREEN_RATING_THRESHOLD &&
    complaintCount === 0 &&
    rejectionRate < PERFORMANCE_CALCULATION_CONFIG.GREEN_REJECTION_RATE_THRESHOLD &&
    totalTrips >= PERFORMANCE_CALCULATION_CONFIG.GREEN_MIN_TRIPS
  ) {
    category = DRIVER_PERFORMANCE_CATEGORIES.GREEN;
  }
  // Use score-based categorization if override rules don't apply
  else if (score >= PERFORMANCE_CALCULATION_CONFIG.GREEN_MIN_SCORE) {
    category = DRIVER_PERFORMANCE_CATEGORIES.GREEN;
  } else if (score >= PERFORMANCE_CALCULATION_CONFIG.YELLOW_MIN_SCORE) {
    category = DRIVER_PERFORMANCE_CATEGORIES.YELLOW;
  } else {
    category = DRIVER_PERFORMANCE_CATEGORIES.RED;
  }

  return {
    category,
    score: Math.round(score),
    rating: driver.currentRating,
    complaintCount,
    totalTrips,
    completedTrips,
    rejectedTrips,
    completionRate: Math.round(completionRate * 100) / 100,
    rejectionRate: Math.round(rejectionRate * 100) / 100,
  };
}

/**
 * Get drivers with performance metrics
 */
export async function getDriversWithPerformance(
  franchiseId?: string,
  includeInactive: boolean = false
): Promise<DriverWithPerformance[]> {
  const whereClause: any = {};

  if (!includeInactive) {
    whereClause.isActive = true;
  }

  if (franchiseId) {
    whereClause.franchiseId = franchiseId;
  }

  const performanceWindowDate = new Date(
    Date.now() - PERFORMANCE_CALCULATION_CONFIG.PERFORMANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const drivers = await prisma.driver.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    include: {
      Trip: {
        where: {
          createdAt: {
            gte: performanceWindowDate,
          },
        },
      },
    },
  });

  // Calculate performance for each driver
  const driversWithPerformance = await Promise.all(
    drivers.map(async (driver) => {
      const performance = await calculateDriverPerformance(driver.id);
      return {
        ...driver,
        performance,
      };
    })
  );

  return driversWithPerformance;
}

/**
 * Sort drivers by performance category and status
 * Priority: Performance (GREEN > YELLOW > RED), then Status (ACTIVE > others)
 */
export function sortDriversByPerformance(
  drivers: DriverWithPerformance[]
): DriverWithPerformance[] {
  const categoryOrder = {
    [DRIVER_PERFORMANCE_CATEGORIES.GREEN]: 1,
    [DRIVER_PERFORMANCE_CATEGORIES.YELLOW]: 2,
    [DRIVER_PERFORMANCE_CATEGORIES.RED]: 3,
  };

  const statusOrder = {
    ACTIVE: 1,
    INACTIVE: 2,
    BLOCKED: 3,
    TERMINATED: 4,
  };

  return [...drivers].sort((a, b) => {
    // First sort by performance category
    const categoryDiff =
      categoryOrder[a.performance.category] -
      categoryOrder[b.performance.category];
    if (categoryDiff !== 0) {
      return categoryDiff;
    }

    // Then sort by status
    const statusDiff =
      (statusOrder[a.status as keyof typeof statusOrder] || 99) -
      (statusOrder[b.status as keyof typeof statusOrder] || 99);
    if (statusDiff !== 0) {
      return statusDiff;
    }

    // Finally sort by performance score (higher is better)
    return b.performance.score - a.performance.score;
  });
}

/**
 * Get available drivers with GREEN performance category
 * Filters drivers who are:
 * - AVAILABLE (driverTripStatus = AVAILABLE)
 * - GREEN performance category
 * - ACTIVE status
 * - Not globally banned
 */
export async function getAvailableGreenDrivers(
  franchiseId?: string
): Promise<DriverWithPerformance[]> {
  const whereClause: any = {
    isActive: true,
    status: "ACTIVE",
    driverTripStatus: "AVAILABLE",
    bannedGlobally: false,
  };

  if (franchiseId) {
    whereClause.franchiseId = franchiseId;
  }

  // Calculate performance window (90 days)
  const performanceWindowDate = new Date(
    Date.now() - PERFORMANCE_CALCULATION_CONFIG.PERFORMANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const drivers = await prisma.driver.findMany({
    where: whereClause,
    include: {
      Trip: {
        where: {
          createdAt: {
            gte: performanceWindowDate,
          },
        },
      },
    },
  });

  // Calculate performance for each driver and filter for GREEN only
  const driversWithPerformance = await Promise.all(
    drivers.map(async (driver) => {
      const performance = await calculateDriverPerformance(driver.id);
      return {
        ...driver,
        performance,
      };
    })
  );

  // Filter only GREEN category drivers
  const greenDrivers = driversWithPerformance.filter(
    (driver) => driver.performance.category === DRIVER_PERFORMANCE_CATEGORIES.GREEN
  );

  // Sort by performance score (higher is better)
  return greenDrivers.sort((a, b) => b.performance.score - a.performance.score);
}

/** Performance category sort order: GREEN first, then YELLOW, then RED */
const PERFORMANCE_CATEGORY_ORDER: Record<DriverPerformanceCategory, number> = {
  [DRIVER_PERFORMANCE_CATEGORIES.GREEN]: 1,
  [DRIVER_PERFORMANCE_CATEGORIES.YELLOW]: 2,
  [DRIVER_PERFORMANCE_CATEGORIES.RED]: 3,
};

function isDayLimitNotFinished(driver: { remainingDailyLimit: number | null }): boolean {
  return driver.remainingDailyLimit === null || driver.remainingDailyLimit > 0;
}

function isAvailable(driver: { driverTripStatus: string | null }): boolean {
  return driver.driverTripStatus === "AVAILABLE";
}

/**
 * Get drivers for trip assignment (all franchise drivers, best options first)
 * Returns ALL drivers who are:
 * - ACTIVE status
 * - Not globally banned
 * (No filter on driverTripStatus – includes both AVAILABLE and ON_TRIP)
 *
 * Sorted by (priority order):
 * 1. AVAILABLE first (driverTripStatus = AVAILABLE), then ON_TRIP
 * 2. Day limit not finished first (remainingDailyLimit > 0 or null)
 * 3. Performance category (GREEN > YELLOW > RED)
 * 4. Performance score (descending)
 */
export async function getAvailableDrivers(
  franchiseId?: string
): Promise<DriverWithPerformance[]> {
  const whereClause: any = {
    isActive: true,
    status: "ACTIVE",
    bannedGlobally: false,
  };

  if (franchiseId) {
    whereClause.franchiseId = franchiseId;
  }

  const performanceWindowDate = new Date(
    Date.now() - PERFORMANCE_CALCULATION_CONFIG.PERFORMANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const drivers = await prisma.driver.findMany({
    where: whereClause,
    include: {
      Trip: {
        where: {
          createdAt: { gte: performanceWindowDate },
        },
      },
    },
  });

  const driversWithPerformance = await Promise.all(
    drivers.map(async (driver) => {
      const performance = await calculateDriverPerformance(driver.id);
      return { ...driver, performance };
    })
  );

  return driversWithPerformance.sort((a, b) => {
    const aAvail = isAvailable(a);
    const bAvail = isAvailable(b);
    if (aAvail !== bAvail) return aAvail ? -1 : 1;
    const aLimitOk = isDayLimitNotFinished(a);
    const bLimitOk = isDayLimitNotFinished(b);
    if (aLimitOk !== bLimitOk) return aLimitOk ? -1 : 1;
    const catA = PERFORMANCE_CATEGORY_ORDER[a.performance.category] ?? 99;
    const catB = PERFORMANCE_CATEGORY_ORDER[b.performance.category] ?? 99;
    if (catA !== catB) return catA - catB;
    return b.performance.score - a.performance.score;
  });
}
