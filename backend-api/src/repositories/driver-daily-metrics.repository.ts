// src/repositories/driver-daily-metrics.repository.ts
import prisma from "../config/prismaClient";
import { CreateDriverDailyMetricsDTO, UpdateDriverDailyMetricsDTO } from "../types/driver-daily-metrics.dto";

/**
 * Get daily metrics for a driver on a specific date
 */
export async function getDriverDailyMetricsByDate(
  driverId: string,
  date: Date
) {
  // Normalize date to start of day
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  return await prisma.driverDailyMetrics.findUnique({
    where: {
      driverId_date: {
        driverId,
        date: normalizedDate,
      },
    },
  });
}

/**
 * Get daily metrics for a driver within a date range
 */
export async function getDriverDailyMetricsByDateRange(
  driverId: string,
  startDate: Date,
  endDate: Date
) {
  // Normalize dates to start of day
  const normalizedStartDate = new Date(startDate);
  normalizedStartDate.setHours(0, 0, 0, 0);
  
  const normalizedEndDate = new Date(endDate);
  normalizedEndDate.setHours(23, 59, 59, 999);

  return await prisma.driverDailyMetrics.findMany({
    where: {
      driverId,
      date: {
        gte: normalizedStartDate,
        lte: normalizedEndDate,
      },
    },
    orderBy: {
      date: "desc",
    },
  });
}

/**
 * Get paginated daily metrics
 */
export async function getDriverDailyMetricsPaginated(
  skip: number,
  take: number,
  driverId?: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {};

  if (driverId) {
    where.driverId = driverId;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);
      where.date.gte = normalizedStartDate;
    }
    if (endDate) {
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(23, 59, 59, 999);
      where.date.lte = normalizedEndDate;
    }
  }

  const [data, total] = await Promise.all([
    prisma.driverDailyMetrics.findMany({
      where,
      skip,
      take,
      orderBy: {
        date: "desc",
      },
      include: {
        Driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            driverCode: true,
          },
        },
      },
    }),
    prisma.driverDailyMetrics.count({ where }),
  ]);

  return { data, total };
}

/**
 * Create or update daily metrics (upsert)
 */
export async function upsertDriverDailyMetrics(
  input: CreateDriverDailyMetricsDTO & { date: Date }
) {
  // Normalize date to start of day
  const normalizedDate = new Date(input.date);
  normalizedDate.setHours(0, 0, 0, 0);

  return await prisma.driverDailyMetrics.upsert({
    where: {
      driverId_date: {
        driverId: input.driverId,
        date: normalizedDate,
      },
    },
    update: {
      numberOfTrips: input.numberOfTrips,
      numberOfComplaints: input.numberOfComplaints,
      distanceTraveled: input.distanceTraveled,
      tripAverageRating: input.tripAverageRating,
      overallRating: input.overallRating,
      dailyLimit: input.dailyLimit,
      remainingLimit: input.remainingLimit,
      incentive: input.incentive,
      bonus: input.bonus,
      cashInHand: input.cashInHand,
      cashSubmittedOnDate: input.cashSubmittedOnDate,
    },
    create: {
      driverId: input.driverId,
      date: normalizedDate,
      numberOfTrips: input.numberOfTrips,
      numberOfComplaints: input.numberOfComplaints,
      distanceTraveled: input.distanceTraveled,
      tripAverageRating: input.tripAverageRating,
      overallRating: input.overallRating,
      dailyLimit: input.dailyLimit,
      remainingLimit: input.remainingLimit,
      incentive: input.incentive,
      bonus: input.bonus,
      cashInHand: input.cashInHand,
      cashSubmittedOnDate: input.cashSubmittedOnDate,
    },
  });
}

/**
 * Update daily metrics
 */
export async function updateDriverDailyMetrics(
  driverId: string,
  date: Date,
  input: UpdateDriverDailyMetricsDTO
) {
  // Normalize date to start of day
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  return await prisma.driverDailyMetrics.update({
    where: {
      driverId_date: {
        driverId,
        date: normalizedDate,
      },
    },
    data: {
      ...(input.numberOfTrips !== undefined && { numberOfTrips: input.numberOfTrips }),
      ...(input.numberOfComplaints !== undefined && { numberOfComplaints: input.numberOfComplaints }),
      ...(input.distanceTraveled !== undefined && { distanceTraveled: input.distanceTraveled }),
      ...(input.tripAverageRating !== undefined && { tripAverageRating: input.tripAverageRating }),
      ...(input.overallRating !== undefined && { overallRating: input.overallRating }),
      ...(input.dailyLimit !== undefined && { dailyLimit: input.dailyLimit }),
      ...(input.remainingLimit !== undefined && { remainingLimit: input.remainingLimit }),
      ...(input.incentive !== undefined && { incentive: input.incentive }),
      ...(input.bonus !== undefined && { bonus: input.bonus }),
      ...(input.cashInHand !== undefined && { cashInHand: input.cashInHand }),
      ...(input.cashSubmittedOnDate !== undefined && { cashSubmittedOnDate: input.cashSubmittedOnDate }),
    },
  });
}

/**
 * Get all daily metrics for a driver (from start to end)
 */
export async function getAllDriverDailyMetrics(driverId: string) {
  return await prisma.driverDailyMetrics.findMany({
    where: {
      driverId,
    },
    orderBy: {
      date: "desc",
    },
  });
}
