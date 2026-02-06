// src/services/driver-daily-metrics.service.ts
import {
  getDriverDailyMetricsByDate,
  getDriverDailyMetricsByDateRange,
  getDriverDailyMetricsPaginated,
  upsertDriverDailyMetrics,
  updateDriverDailyMetrics,
  getAllDriverDailyMetrics,
} from "../repositories/driver-daily-metrics.repository";
import { getDriverById } from "../repositories/driver.repository";
import {
  CreateDriverDailyMetricsDTO,
  UpdateDriverDailyMetricsDTO,
  DriverDailyMetricsResponseDTO,
  GetDriverDailyMetricsQueryDTO,
  PaginatedDailyMetricsQueryDTO,
  PaginatedDriverDailyMetricsResponseDTO,
} from "../types/driver-daily-metrics.dto";
import { NotFoundError } from "../utils/errors";
import { ERROR_MESSAGES } from "../constants/errors";
import prisma from "../config/prismaClient";
import logger from "../config/logger";

/**
 * Map Prisma model to response DTO
 */
function mapDriverDailyMetricsToResponse(metrics: any): DriverDailyMetricsResponseDTO {
  return {
    id: metrics.id,
    driverId: metrics.driverId,
    date: metrics.date,
    numberOfTrips: metrics.numberOfTrips,
    numberOfComplaints: metrics.numberOfComplaints,
    distanceTraveled: Number(metrics.distanceTraveled) || 0,
    tripAverageRating: metrics.tripAverageRating,
    overallRating: metrics.overallRating,
    dailyLimit: metrics.dailyLimit ? Number(metrics.dailyLimit) : null,
    remainingLimit: metrics.remainingLimit ? Number(metrics.remainingLimit) : null,
    incentive: metrics.incentive ? Number(metrics.incentive) : null,
    bonus: metrics.bonus ? Number(metrics.bonus) : null,
    cashInHand: Number(metrics.cashInHand) || 0,
    cashSubmittedOnDate: Number(metrics.cashSubmittedOnDate) || 0,
    createdAt: metrics.createdAt,
    updatedAt: metrics.updatedAt,
  };
}

/**
 * Get daily metrics for a specific date
 */
export async function getDriverDailyMetrics(
  driverId: string,
  date: Date
): Promise<DriverDailyMetricsResponseDTO | null> {
  // Verify driver exists
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  const metrics = await getDriverDailyMetricsByDate(driverId, date);
  return metrics ? mapDriverDailyMetricsToResponse(metrics) : null;
}

/**
 * Get daily metrics for a date range
 */
export async function getDriverDailyMetricsByRange(
  driverId: string,
  startDate: Date,
  endDate: Date
): Promise<DriverDailyMetricsResponseDTO[]> {
  // Verify driver exists
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  const metrics = await getDriverDailyMetricsByDateRange(driverId, startDate, endDate);
  return metrics.map(mapDriverDailyMetricsToResponse);
}

/**
 * Get paginated daily metrics
 */
export async function getPaginatedDriverDailyMetrics(
  query: PaginatedDailyMetricsQueryDTO
): Promise<PaginatedDriverDailyMetricsResponseDTO> {
  const { page = 1, limit = 10, driverId, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const { data, total } = await getDriverDailyMetricsPaginated(
    skip,
    limit,
    driverId,
    startDate,
    endDate
  );

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapDriverDailyMetricsToResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
}

/**
 * Create or update daily metrics
 */
export async function createOrUpdateDriverDailyMetrics(
  input: CreateDriverDailyMetricsDTO & { date: Date }
): Promise<DriverDailyMetricsResponseDTO> {
  // Verify driver exists
  const driver = await getDriverById(input.driverId);
  if (!driver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  const metrics = await upsertDriverDailyMetrics(input);
  return mapDriverDailyMetricsToResponse(metrics);
}

/**
 * Update daily metrics
 */
export async function updateDriverDailyMetricsService(
  driverId: string,
  date: Date,
  input: UpdateDriverDailyMetricsDTO
): Promise<DriverDailyMetricsResponseDTO> {
  // Verify driver exists
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  const metrics = await updateDriverDailyMetrics(driverId, date, input);
  return mapDriverDailyMetricsToResponse(metrics);
}

/**
 * Aggregate and calculate daily metrics for a driver on a specific date
 * This function calculates metrics from trips, complaints, ratings, etc.
 */
export async function calculateAndSaveDriverDailyMetrics(
  driverId: string,
  date: Date
): Promise<DriverDailyMetricsResponseDTO> {
  // Verify driver exists
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  // Normalize date to start of day
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  const endDate = new Date(normalizedDate);
  endDate.setHours(23, 59, 59, 999);

  // Get trips for the day
  const trips = await prisma.trip.findMany({
    where: {
      driverId,
      createdAt: {
        gte: normalizedDate,
        lte: endDate,
      },
      status: {
        in: ["TRIP_ENDED", "COMPLETED", "PAYMENT_DONE"],
      },
    },
  });

  // Get complaints for the day
  const complaints = await prisma.complaint.findMany({
    where: {
      driverId,
      createdAt: {
        gte: normalizedDate,
        lte: endDate,
      },
    },
  });

  // Get ratings for trips on this day
  const tripIds = trips.map((trip) => trip.id);
  const ratings = tripIds.length > 0
    ? await prisma.driverRating.findMany({
        where: {
          tripId: { in: tripIds },
          createdAt: {
            gte: normalizedDate,
            lte: endDate,
          },
        },
      })
    : [];

  // Calculate distance traveled (from odometer readings if available)
  let distanceTraveled = 0;
  trips.forEach((trip) => {
    if (trip.startOdometer && trip.endOdometer) {
      distanceTraveled += trip.endOdometer - trip.startOdometer;
    }
  });

  // Calculate average rating for trips on this day
  let tripAverageRating: number | null = null;
  if (ratings.length > 0) {
    const totalRating = ratings.reduce((sum, rating) => sum + rating.overallRating, 0);
    tripAverageRating = totalRating / ratings.length;
  }

  // Get overall rating (current driver rating)
  const overallRating = driver.currentRating;

  // Get daily limit and remaining limit from driver
  const dailyLimit = driver.dailyTargetAmount ? Number(driver.dailyTargetAmount) : null;
  const remainingLimit = driver.remainingDailyLimit ? Number(driver.remainingDailyLimit) : null;

  // Get incentive and bonus from driver (these might be calculated elsewhere)
  const incentive = driver.incentive ? Number(driver.incentive) : null;
  const bonus = driver.bonus ? Number(driver.bonus) : null;

  // Get cash in hand from driver
  const cashInHand = Number(driver.cashInHand) || 0;

  // Get cash submitted on this date (from daily metrics if exists, or 0)
  const existingMetrics = await getDriverDailyMetricsByDate(driverId, normalizedDate);
  const cashSubmittedOnDate = existingMetrics
    ? Number(existingMetrics.cashSubmittedOnDate) || 0
    : 0;

  // Create or update daily metrics
  const metrics = await upsertDriverDailyMetrics({
    driverId,
    date: normalizedDate,
    numberOfTrips: trips.length,
    numberOfComplaints: complaints.length,
    distanceTraveled,
    tripAverageRating,
    overallRating,
    dailyLimit,
    remainingLimit,
    incentive,
    bonus,
    cashInHand,
    cashSubmittedOnDate,
  });

  logger.info("Driver daily metrics calculated and saved", {
    driverId,
    date: normalizedDate.toISOString(),
    numberOfTrips: trips.length,
    numberOfComplaints: complaints.length,
    distanceTraveled,
  });

  return mapDriverDailyMetricsToResponse(metrics);
}

/**
 * Record cash submission for a specific date
 */
export async function recordCashSubmission(
  driverId: string,
  date: Date,
  cashAmount: number
): Promise<DriverDailyMetricsResponseDTO> {
  // Verify driver exists
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  // Normalize date to start of day
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  // Get or create daily metrics for this date
  const existingMetrics = await getDriverDailyMetricsByDate(driverId, normalizedDate);

  if (existingMetrics) {
    // Update existing metrics
    const updatedMetrics = await updateDriverDailyMetrics(driverId, normalizedDate, {
      cashSubmittedOnDate: Number(existingMetrics.cashSubmittedOnDate) + cashAmount,
    });
    return mapDriverDailyMetricsToResponse(updatedMetrics);
  } else {
    // Create new metrics with cash submission
    const metrics = await upsertDriverDailyMetrics({
      driverId,
      date: normalizedDate,
      numberOfTrips: 0,
      numberOfComplaints: 0,
      distanceTraveled: 0,
      cashSubmittedOnDate: cashAmount,
      cashInHand: Number(driver.cashInHand) || 0,
    });
    return mapDriverDailyMetricsToResponse(metrics);
  }
}

/**
 * Get all daily metrics for a driver (from start to end)
 */
export async function getAllDriverDailyMetricsService(
  driverId: string
): Promise<DriverDailyMetricsResponseDTO[]> {
  // Verify driver exists
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  const metrics = await getAllDriverDailyMetrics(driverId);
  return metrics.map(mapDriverDailyMetricsToResponse);
}
