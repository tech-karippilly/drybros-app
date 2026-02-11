import {
  getAllTrips,
  getTripById as repoGetTripById,
  createTrip as repoCreateTrip,
  createTripPhase1 as repoCreateTripPhase1,
  updateTrip,
  getUnassignedTrips,
  getTripsPaginated,
  getTripsFiltered,
  getUnassignedTripsPaginated,
  getTripsByDriver,
  getTripsByDriverAllStatuses,
  getAssignedTrips as repoGetAssignedTrips,
  getAssignedTripsPaginated as repoGetAssignedTripsPaginated,
  type TripFilters,
} from "../repositories/trip.repository";
import { getActivityLogsByTripId } from "../repositories/activity.repository";
import { TripStatus, PaymentStatus, PaymentMode, ActivityAction, ActivityEntityType, TripOfferStatus } from "@prisma/client";

import { getCustomerById } from "../repositories/customer.repository";
import { 
  getDriverById, 
  updateDriverTripStatus,
  addCashInHand,
  reduceRemainingDailyLimit,
} from "../repositories/driver.repository";
import { generateOtp } from "../utils/otp";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/authConfig";
import { findOrCreateCustomer } from "./customer.service";
import { createTripEarningTransaction } from "./driverTransaction.service";
import { createDriverTransaction } from "../repositories/driverTransaction.repository";
import { TransactionType, DriverTransactionType, Prisma } from "@prisma/client";
import {
  getDriverEarningsConfigByDriver,
  getDriverEarningsConfigByFranchise,
  getDriverEarningsConfig,
} from "../repositories/earningsConfig.repository";
import {
  CAR_GEAR_TYPES,
  CAR_TYPE_CATEGORIES,
  type CarGearType,
  type CarTypeCategory,
  TRIP_ERROR_MESSAGES,
  RESCHEDULABLE_TRIP_STATUSES,
  CANCELLABLE_TRIP_STATUSES,
  REASSIGNABLE_TRIP_STATUSES,
  TRIP_HISTORY_LATE,
} from "../constants/trip";
import { calculateTripPrice } from "./pricing.service";
import { tripDispatchService } from "./tripDispatch.service";
import {
  getDriversWithPerformance,
  sortDriversByPerformance,
  DriverWithPerformance,
} from "./driver-performance.service";
import prisma from "../config/prismaClient";
import { logActivity } from "./activity.service";
import { socketService } from "./socket.service";
import logger from "../config/logger";
import { sendTripStartOtpEmail, sendTripEndOtpEmail, sendTripEndConfirmationEmail } from "./email.service";
import { calculateAndSaveDriverDailyMetrics } from "./driver-daily-metrics.service";
import {
  validateDriverForTripAssignment,
  validateTripForAssignment,
  getDriversWithActiveTrips,
} from "./trip-validation.service";

function extractCarGearTypeFromLegacyCarType(carType?: string | null): string | null {
  if (!carType) return null;
  try {
    const parsed = JSON.parse(carType) as { gearType?: unknown };
    return typeof parsed?.gearType === "string" ? parsed.gearType : null;
  } catch {
    return null;
  }
}

function augmentTripCarPreferences<
  T extends { carGearType?: string | null; carType?: string | null }
>(trip: T): T & { carGearType: string | null; transmissionType: string | null } {
  const carGearType = trip.carGearType ?? extractCarGearTypeFromLegacyCarType(trip.carType);
  return {
    ...(trip as any),
    carGearType,
    // Client-friendly alias; same meaning/values as carGearType
    transmissionType: carGearType,
  };
}

interface CreateTripInput {
  franchiseId: number;
  driverId: number;
  customerId: string;
  tripType: string;
  pickupLocation: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropLocation?: string | null;
  dropLat?: number | null;
  dropLng?: number | null;
  scheduledAt?: string | null;
  baseAmount: number;
  extraAmount?: number;
}

export async function listTrips() {
  const trips = await getAllTrips();
  return trips.map(augmentTripCarPreferences);
}

export async function listTripsFiltered(filters?: TripFilters) {
  const trips = await getTripsFiltered(filters);
  return trips.map(augmentTripCarPreferences);
}

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface TripListQuery extends PaginationQuery {
  filters?: TripFilters;
}

export interface PaginatedTripsResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Get unassigned trips (PENDING or NOT_ASSIGNED status)
 */
export async function listUnassignedTrips() {
  const trips = await getUnassignedTrips();
  return trips.map(augmentTripCarPreferences);
}

/**
 * Get all trips with pagination and optional filters
 */
export async function listTripsPaginated(
  pagination: PaginationQuery,
  filters?: TripFilters
): Promise<PaginatedTripsResponse> {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const { data, total } = await getTripsPaginated(skip, limit, filters);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(augmentTripCarPreferences),
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
 * Get unassigned trips with pagination
 */
export async function listUnassignedTripsPaginated(
  pagination: PaginationQuery
): Promise<PaginatedTripsResponse> {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const { data, total } = await getUnassignedTripsPaginated(skip, limit);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(augmentTripCarPreferences),
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

export async function getTrip(id: string) {
  const trip = await repoGetTripById(id);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  const franchiseId = trip.franchiseId;

  // Fetch all statistics in parallel for better performance
  const [
    totalStaffCount,
    totalDriversCount,
    totalTripsCount,
    totalComplaintsCount,
    totalRevenue,
    driversList,
    staffList,
  ] = await Promise.all([
    // Total staff count
    prisma.staff.count({
      where: {
        franchiseId,
        isActive: true,
      },
    }),
    // Total drivers count
    prisma.driver.count({
      where: {
        franchiseId,
        isActive: true,
      },
    }),
    // Total trips count
    prisma.trip.count({
      where: {
        franchiseId,
      },
    }),
    // Total complaints count (complaints related to drivers or staff in this franchise)
    prisma.complaint.count({
      where: {
        OR: [
          {
            Driver: {
              franchiseId,
            },
          },
          {
            Staff: {
              franchiseId,
            },
          },
        ],
      },
    }),
    // Total revenue (sum of finalAmount from all trips in this franchise)
    prisma.trip.aggregate({
      where: {
        franchiseId,
      },
      _sum: {
        finalAmount: true,
      },
    }),
    // Driver details list
    prisma.driver.findMany({
      where: {
        franchiseId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        driverCode: true,
        status: true,
        currentRating: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    // Staff details list
    prisma.staff.findMany({
      where: {
        franchiseId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        monthlySalary: true,
        status: true,
        isActive: true,
        createdAt: true,
        joinDate: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const augmentedTrip = augmentTripCarPreferences(trip);

  return {
    ...augmentedTrip,
    statistics: {
      totalStaff: totalStaffCount,
      totalDrivers: totalDriversCount,
      totalTrips: totalTripsCount,
      totalComplaints: totalComplaintsCount,
      totalRevenue: totalRevenue._sum.finalAmount || 0,
    },
    drivers: driversList,
    staff: staffList,
  };
}

/**
 * Get available drivers for trip assignment, prioritized by performance
 */
/**
 * Get trips assigned to a driver
 */
export async function getDriverAssignedTrips(driverId: string) {
  const trips = await getTripsByDriver(driverId);
  return trips.map(augmentTripCarPreferences);
}

/**
 * Get ALL trips for a driver (any status).
 *
 * Use for the Trips tab / trip history screens where completed/cancelled trips
 * must be visible.
 */
export async function getDriverTripsAllStatuses(driverId: string) {
  const trips = await getTripsByDriverAllStatuses(driverId);
  return trips.map(augmentTripCarPreferences);
}

/**
 * Get all assigned trips (trips that have a driver assigned)
 * Supports optional franchise filtering
 */
export async function getAssignedTrips(
  franchiseId?: string
): Promise<any[]> {
  const trips = await repoGetAssignedTrips(franchiseId);
  return trips.map(augmentTripCarPreferences);
}

/**
 * Get assigned trips with pagination
 */
export async function getAssignedTripsPaginated(
  pagination: PaginationQuery,
  franchiseId?: string
): Promise<PaginatedTripsResponse> {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const { data, total } = await repoGetAssignedTripsPaginated(skip, limit, franchiseId);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(augmentTripCarPreferences),
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

export async function getAvailableDriversForTrip(tripId: string) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }
  if (trip.driverId) {
    const err: any = new Error("Trip already has a driver assigned");
    err.statusCode = 400;
    throw err;
  }

  // Get all drivers with performance metrics from same franchise
  const allDrivers = await getDriversWithPerformance(trip.franchiseId, false);

  // Batch check which drivers have active trips (optimize N+1 query)
  const driverIds = allDrivers.map((d) => d.id);
  const driversWithActiveTrips = await getDriversWithActiveTrips(driverIds);

  // Filter eligible drivers and calculate match score
  const availableDrivers = allDrivers
    .filter((driver) => {
      // Mandatory eligibility checks
      if (driver.franchiseId !== trip.franchiseId) return false;
      if (driver.status !== "ACTIVE" || !driver.isActive) return false;
      if (driver.bannedGlobally) return false;
      if (driver.licenseExpDate < new Date()) return false;
      if (driversWithActiveTrips.has(driver.id)) return false;
      return true;
    })
    .map((driver) => {

      // Calculate additional match score (car type, etc.)
      let matchScore = 0;

      // Car type matching (if trip has car type requirement)
      if (trip.carType || (trip as any).carGearType) {
        try {
          // Backward compatible:
          // - legacy `carType`: JSON string {"gearType":"MANUAL","category":"PREMIUM"}
          // - new `carType`: plain category string "PREMIUM" | "LUXURY" | "NORMAL"
          const legacy = (() => {
            if (!trip.carType) return null;
            try {
              const parsed = JSON.parse(trip.carType) as { gearType?: string; category?: string };
              if (parsed && (parsed.gearType || parsed.category)) return parsed;
              return null;
            } catch {
              return null;
            }
          })();

          const tripGearType = (trip as any).carGearType ?? legacy?.gearType ?? null;
          const tripCategory = legacy?.category ?? (trip.carType ? trip.carType : null);
          const driverCarTypes = JSON.parse(driver.carTypes || "[]");

          // Check gear type match
          if (tripGearType && driverCarTypes.includes(tripGearType)) {
            matchScore += 25;
          }

          // Check category match
          const categoryMap: Record<string, string[]> = {
            PREMIUM: ["PREMIUM_CARS", "LUXURY_CARS"],
            LUXURY: ["LUXURY_CARS", "PREMIUM_CARS"],
            NORMAL: ["MANUAL", "AUTOMATIC"],
          };

          if (
            tripCategory &&
            categoryMap[tripCategory]?.some((cat) =>
              driverCarTypes.includes(cat)
            )
          ) {
            matchScore += 25;
          }
        } catch {
          // If parsing fails, skip car type scoring
        }
      }

      return {
        driver,
        matchScore,
      };
    });

  // Sort by: Performance category first, then status, then match score
  const categoryOrder = {
    GREEN: 1,
    YELLOW: 2,
    RED: 3,
  };

  const statusOrder = {
    ACTIVE: 1,
    INACTIVE: 2,
    BLOCKED: 3,
    TERMINATED: 4,
  };

  availableDrivers.sort((a, b) => {
    // First: Performance category (GREEN > YELLOW > RED)
    const catDiff =
      categoryOrder[a.driver.performance.category] -
      categoryOrder[b.driver.performance.category];
    if (catDiff !== 0) return catDiff;

    // Second: Status (ACTIVE > others)
    const statusDiff =
      (statusOrder[a.driver.status as keyof typeof statusOrder] || 99) -
      (statusOrder[b.driver.status as keyof typeof statusOrder] || 99);
    if (statusDiff !== 0) return statusDiff;

    // Third: Performance score (higher is better)
    const scoreDiff = b.driver.performance.score - a.driver.performance.score;
    if (scoreDiff !== 0) return scoreDiff;

    // Fourth: Match score (car type, etc.)
    return b.matchScore - a.matchScore;
  });

  // Get pickup location from trip
  const pickupLat = trip.pickupLat;
  const pickupLng = trip.pickupLng;
  const { calculateDistance } = await import("../utils/geo");

  // Return drivers with match information, location, and distance
  return availableDrivers.map(({ driver, matchScore }) => {
    const result: any = {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone,
      driverCode: driver.driverCode,
      status: driver.status,
      currentRating: driver.currentRating,
      performance: driver.performance,
      matchScore,
    };

    // Add pickup location
    if (pickupLat !== null && pickupLng !== null) {
      result.pickupLocation = { lat: pickupLat, lng: pickupLng };
    }

    // Add driver location
    result.driverLocation = {
      lat: driver.liveLocationLat,
      lng: driver.liveLocationLng,
    };

    // Calculate distance if both locations are available
    if (
      pickupLat !== null &&
      pickupLng !== null &&
      driver.liveLocationLat !== null &&
      driver.liveLocationLng !== null
    ) {
      result.distanceKm = parseFloat(
        calculateDistance(
          pickupLat,
          pickupLng,
          driver.liveLocationLat,
          driver.liveLocationLng
        ).toFixed(2)
      );
    }

    return result;
  });
}

/**
 * Get available drivers for a trip sorted by average rating and suitability
 * 1. Get trip details and franchise
 * 2. Get drivers from franchise
 * 3. Filter by carCategory and transmissionType match
 * 4. Get average ratings from TripReview
 * 5. Sort by rating (higher first) and suitability
 */
export async function getAvailableDriversSortedByRating(tripId: string) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  // Get franchise ID from trip
  const franchiseId = trip.franchiseId;

  // Get all active drivers from the franchise
  const { getAllDrivers } = await import("../repositories/driver.repository");
  const allDrivers = await getAllDrivers(false, franchiseId);

  // Extract trip requirements
  const tripGearType = (trip as any).carGearType || extractCarGearTypeFromLegacyCarType(trip.carType);
  const tripCarType = trip.carType;
  
  // Parse trip car category from legacy format or direct value
  let tripCarCategory: string | null = null;
  if (tripCarType) {
    try {
      const parsed = JSON.parse(tripCarType);
      tripCarCategory = parsed.category || tripCarType;
    } catch {
      tripCarCategory = tripCarType;
    }
  }

  // Filter drivers based on suitability
  const suitableDrivers = allDrivers.filter((driver) => {
    // Basic eligibility
    if (driver.status !== "ACTIVE" || !driver.isActive) return false;
    if (driver.bannedGlobally) return false;
    if (driver.licenseExpDate < new Date()) return false;

    // Check transmission type match (carGearType)
    if (tripGearType) {
      const hasMatchingTransmission = driver.transmissionTypes.includes(tripGearType as any);
      if (!hasMatchingTransmission) return false;
    }

    // Check car category match - driver must have the exact category required
    if (tripCarCategory) {
      const hasMatchingCategory = driver.carCategories.some((cat: string) => 
        cat === tripCarCategory
      );
      
      if (!hasMatchingCategory) return false;
    }

    return true;
  });

  // Get average ratings for all suitable drivers
  const driverIds = suitableDrivers.map((d) => d.id);
  const { getAverageRatingsByDriverIds } = await import("../repositories/tripReview.repository");
  const ratingsMap = await getAverageRatingsByDriverIds(driverIds);

  // Map drivers with their ratings
  const driversWithRatings = suitableDrivers.map((driver) => ({
    id: driver.id,
    firstName: driver.firstName,
    lastName: driver.lastName,
    phone: driver.phone,
    email: driver.email,
    driverCode: driver.driverCode,
    status: driver.status,
    driverTripStatus: driver.driverTripStatus,
    currentRating: driver.currentRating,
    averageRating: ratingsMap.get(driver.id) || 0,
    transmissionTypes: driver.transmissionTypes,
    carCategories: driver.carCategories,
    franchiseId: driver.franchiseId,
  }));

  // Sort by average rating (descending) - drivers with higher ratings first
  driversWithRatings.sort((a, b) => {
    // Primary: Average rating (higher is better)
    const ratingDiff = b.averageRating - a.averageRating;
    if (ratingDiff !== 0) return ratingDiff;

    // Secondary: Current rating (higher is better)
    const currentRatingA = a.currentRating || 0;
    const currentRatingB = b.currentRating || 0;
    const currentRatingDiff = currentRatingB - currentRatingA;
    if (currentRatingDiff !== 0) return currentRatingDiff;

    // Tertiary: Driver code (for consistent ordering)
    return a.driverCode.localeCompare(b.driverCode);
  });

  return {
    tripId: trip.id,
    franchiseId: trip.franchiseId,
    tripRequirements: {
      carType: tripCarType,
      carGearType: tripGearType,
      carCategory: tripCarCategory,
    },
    availableDrivers: driversWithRatings,
  };
}

/**
 * Assign a driver to a trip with explicit franchise validation
 */
export async function assignDriverToTripWithFranchise(
  tripId: string,
  driverId: string,
  franchiseId: string,
  assignedBy?: string
) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }
  
  // Validate franchise id matches trip
  if (trip.franchiseId !== franchiseId) {
    const err: any = new Error("Franchise ID does not match the trip's franchise");
    err.statusCode = 400;
    throw err;
  }
  
  validateTripForAssignment(trip);
  
  const driver = await getDriverById(driverId);
  if (!driver) {
    const err: any = new Error("Driver not found");
    err.statusCode = 404;
    throw err;
  }
  
  // Validate driver eligibility
  await validateDriverForTripAssignment(driver, trip, franchiseId);
  // Assign driver
  const updatedTrip = await updateTrip(tripId, {
    driverId,
    status: "ASSIGNED",
  });
  
  // Update driver trip status to ON_TRIP
  await updateDriverTripStatus(driverId, "ON_TRIP");

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.TRIP_ASSIGNED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: franchiseId,
    driverId: driverId,
    tripId: tripId,
    userId: assignedBy || null,
    description: `Trip ${tripId} assigned to driver ${driver.firstName} ${driver.lastName} (${driver.driverCode})`,
    metadata: {
      tripId: tripId,
      driverId: driverId,
      driverCode: driver.driverCode,
      customerName: trip.customerName,
      franchiseId: franchiseId,
    },
  }).catch((err) => {
    logger.error("Failed to log trip assignment activity", { error: err });
  });
  
  return updatedTrip;
}

/**
 * Assign a driver to a trip
 */
export async function assignDriverToTrip(
  tripId: string,
  driverId: string,
  assignedBy?: string
) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }
  
  validateTripForAssignment(trip);
  
  const driver = await getDriverById(driverId);
  if (!driver) {
    const err: any = new Error("Driver not found");
    err.statusCode = 404;
    throw err;
  }
  
  // Validate driver eligibility
  await validateDriverForTripAssignment(driver, trip);
  // Assign driver
  const updatedTrip = await updateTrip(tripId, {
    driverId,
    status: "ASSIGNED",
  });
  
  // Update driver trip status to ON_TRIP
  await updateDriverTripStatus(driverId, "ON_TRIP");

  // Log activity (non-blocking) - This will appear in driver alerts
  logActivity({
    action: ActivityAction.TRIP_ASSIGNED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: trip.franchiseId,
    driverId: driverId,
    tripId: tripId,
    userId: assignedBy || null,
    description: `Trip ${tripId} assigned to driver ${driver.firstName} ${driver.lastName} (${driver.driverCode})`,
    metadata: {
      tripId: tripId,
      driverId: driverId,
      driverCode: driver.driverCode,
      customerName: trip.customerName,
    },
  }).catch((err) => {
    logger.error("Failed to log trip assignment activity", { error: err });
  });

  // Emit real-time socket notification to driver
  try {
    socketService.emitTripAssigned(driverId, {
      tripId: tripId,
    });
    logger.info("Socket notification sent for trip assignment", {
      driverId,
      tripId,
    });
  } catch (err) {
    logger.error("Failed to emit socket notification for trip assignment", {
      error: err,
      driverId,
      tripId,
    });
  }
  
  return updatedTrip;
}

export async function createTrip(input: CreateTripInput) {
  const customer = await getCustomerById(input.customerId);
  if (!customer) {
    const err: any = new Error("Customer not found for this trip");
    err.statusCode = 400;
    throw err;
  }

  const driver = await getDriverById(input.driverId);
  if (!driver) {
    const err: any = new Error("Driver not found for this trip");
    err.statusCode = 400;
    throw err;
  }

  if (driver.status !== "ACTIVE") {
    const err: any = new Error("Driver is not active");
    err.statusCode = 400;
    throw err;
  }

  if (driver.franchiseId !== input.franchiseId) {
    const err: any = new Error("Driver belongs to a different franchise");
    err.statusCode = 400;
    throw err;
  }

  const extra = input.extraAmount ?? 0;
  const totalAmount = input.baseAmount + extra;
  const finalAmount = totalAmount;
  const scheduledAtDate = input.scheduledAt
    ? new Date(input.scheduledAt)
    : null;

  return repoCreateTrip({
    franchiseId: input.franchiseId,
    driverId: input.driverId,
    customerId: input.customerId,
    customerName: customer.fullName,
    customerPhone: customer.phone,
    tripType: input.tripType,
    pickupLocation: input.pickupLocation,
    pickupLat: input.pickupLat ?? null,
    pickupLng: input.pickupLng ?? null,
    dropLocation: input.dropLocation ?? null,
    dropLat: input.dropLat ?? null,
    dropLng: input.dropLng ?? null,
    scheduledAt: scheduledAtDate ?? null,
    baseAmount: input.baseAmount,
    extraAmount: extra,
    totalAmount,
    finalAmount,
  });
}

export async function driverAcceptTrip(tripId: string, driverId: string) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  if (trip.driverId !== driverId) {
    const err: any = new Error("This trip is not assigned to this driver");
    err.statusCode = 403;
    throw err;
  }

  if (trip.status !== "ASSIGNED") {
    const err: any = new Error("Trip is not in ASSIGNED state");
    err.statusCode = 400;
    throw err;
  }

  const updatedTrip = await updateTrip(tripId, { status: "DRIVER_ACCEPTED" });

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.TRIP_ACCEPTED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: trip.franchiseId,
    driverId: driverId,
    tripId: tripId,
    description: `Driver accepted trip ${tripId}`,
    metadata: {
      tripId: tripId,
      driverId: driverId,
      customerName: trip.customerName,
    },
  }).catch((err) => {
    logger.error("Failed to log trip acceptance activity", { error: err });
  });

  // Emit socket event for trip acceptance
  const { socketService } = await import("./socket.service");
  try {
    socketService.emitTripAccepted(tripId, {
      tripId,
      driverId,
      status: "DRIVER_ACCEPTED",
      acceptedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Failed to emit trip acceptance socket event", { error: err });
  }

  return updatedTrip;
}

export async function driverRejectTrip(tripId: string, driverId: string) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  if (trip.driverId !== driverId) {
    const err: any = new Error("This trip is not assigned to this driver");
    err.statusCode = 403;
    throw err;
  }

  if (trip.status !== "ASSIGNED") {
    const err: any = new Error("Trip is not in ASSIGNED state");
    err.statusCode = 400;
    throw err;
  }

  const updatedTrip = await updateTrip(tripId, {
    status: "REJECTED_BY_DRIVER",
    driverId: null,
  });
  
  // Update driver trip status back to AVAILABLE when they reject
  await updateDriverTripStatus(driverId, "AVAILABLE");

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.TRIP_REJECTED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: trip.franchiseId,
    driverId: driverId,
    tripId: tripId,
    description: `Driver rejected trip ${tripId}`,
    metadata: {
      tripId: tripId,
      driverId: driverId,
      customerName: trip.customerName,
    },
  }).catch((err) => {
    logger.error("Failed to log trip rejection activity", { error: err });
  });

  // Emit socket event for trip rejection
  const { socketService } = await import("./socket.service");
  try {
    socketService.emitTripRejected(tripId, {
      tripId,
      driverId,
      status: "REJECTED_BY_DRIVER",
      rejectedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Failed to emit trip rejection socket event", { error: err });
  }
  
  return updatedTrip;
}

export interface RescheduleTripInput {
  tripDate: string; // YYYY-MM-DD or DD/MM/YYYY
  tripTime: string; // HH:mm or HH:mm AM/PM
}

export async function rescheduleTrip(
  tripId: string,
  input: RescheduleTripInput
) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.TRIP_NOT_FOUND);
    err.statusCode = 404;
    throw err;
  }

  if (!(RESCHEDULABLE_TRIP_STATUSES as readonly string[]).includes(trip.status)) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.RESCHEDULE_NOT_ALLOWED);
    err.statusCode = 400;
    throw err;
  }

  let scheduledAt: Date;
  try {
    let hours: number, minutes: number;
    const timeStr = input.tripTime.trim().toUpperCase();
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) throw new Error("Invalid time format");
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      hours = h;
      minutes = m;
    } else {
      const [h, m] = input.tripTime.split(":").map(Number);
      hours = h;
      minutes = m;
    }
    let tripDateTime: Date;
    if (input.tripDate.includes("/")) {
      const [day, month, year] = input.tripDate.split("/").map(Number);
      tripDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    } else {
      tripDateTime = new Date(input.tripDate);
      tripDateTime.setHours(hours, minutes, 0, 0);
    }
    scheduledAt = tripDateTime;
  } catch (e: any) {
    const err: any = new Error(`Invalid trip date or time format: ${e?.message || "Unknown"}`);
    err.statusCode = 400;
    throw err;
  }

  const updatedTrip = await updateTrip(tripId, {
    scheduledAt,
    updatedAt: new Date(),
  });

  logActivity({
    action: ActivityAction.TRIP_UPDATED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: trip.franchiseId,
    tripId,
    userId: null,
    description: `Trip ${tripId} rescheduled to ${scheduledAt.toISOString()}`,
    metadata: { tripId, scheduledAt: scheduledAt.toISOString(), rescheduled: true },
  }).catch((err) => logger.error("Failed to log reschedule activity", { error: err }));

  return updatedTrip;
}

export interface CancelTripInput {
  cancelledBy: "OFFICE" | "CUSTOMER";
  reason?: string | null;
}

export async function cancelTrip(tripId: string, input: CancelTripInput) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.TRIP_NOT_FOUND);
    err.statusCode = 404;
    throw err;
  }

  if (!(CANCELLABLE_TRIP_STATUSES as readonly string[]).includes(trip.status)) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.CANCEL_NOT_ALLOWED);
    err.statusCode = 400;
    throw err;
  }

  const status =
    input.cancelledBy === "OFFICE" ? "CANCELLED_BY_OFFICE" : "CANCELLED_BY_CUSTOMER";
  const previousDriverId = trip.driverId;
  const hadDriver = !!previousDriverId;

  const updateData: { status: string; driverId?: null; updatedAt: Date } = {
    status,
    updatedAt: new Date(),
  };
  if (previousDriverId) {
    updateData.driverId = null;
  }

  const updatedTrip = await updateTrip(tripId, updateData);

  if (previousDriverId) {
    await updateDriverTripStatus(previousDriverId, "AVAILABLE");
  }

  logActivity({
    action: ActivityAction.TRIP_CANCELLED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: trip.franchiseId,
    driverId: previousDriverId,
    tripId,
    userId: null,
    description: `Trip ${tripId} cancelled by ${input.cancelledBy}`,
    metadata: {
      tripId,
      cancelledBy: input.cancelledBy,
      reason: input.reason ?? null,
      previousDriverId: previousDriverId ?? null,
      hadDriver,
    },
  }).catch((err) => logger.error("Failed to log cancel activity", { error: err }));

  return updatedTrip;
}

/**
 * Cancel trip by driver after accepting.
 * This triggers auto-reassignment to find another driver.
 */
export async function cancelTripByDriver(tripId: string, driverId: string, reason?: string) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.TRIP_NOT_FOUND);
    err.statusCode = 404;
    throw err;
  }

  // Verify this driver is assigned to the trip
  if (trip.driverId !== driverId) {
    const err: any = new Error("You are not assigned to this trip");
    err.statusCode = 403;
    throw err;
  }

  // Driver can only cancel if trip hasn't started yet
  const allowedStatuses = ["ASSIGNED", "DRIVER_ACCEPTED", "DRIVER_ON_THE_WAY"];
  if (!allowedStatuses.includes(trip.status)) {
    const err: any = new Error("Trip cannot be cancelled at this stage");
    err.statusCode = 400;
    throw err;
  }

  logger.info("Driver cancelling trip, triggering reassignment", {
    tripId,
    driverId,
    tripStatus: trip.status,
    reason,
  });

  // Reset trip to NOT_ASSIGNED for reassignment
  await updateTrip(tripId, {
    status: TripStatus.NOT_ASSIGNED,
    driverId: null,
    updatedAt: new Date(),
  });

  // Reset driver to AVAILABLE
  await updateDriverTripStatus(driverId, "AVAILABLE");

  // Cancel any active offers
  await prisma.tripOffer.updateMany({
    where: {
      tripId,
      status: { in: [TripOfferStatus.OFFERED, TripOfferStatus.ACCEPTED] },
    },
    data: {
      status: TripOfferStatus.CANCELLED,
    },
  });

  // Log activity
  logActivity({
    action: ActivityAction.TRIP_CANCELLED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: trip.franchiseId,
    driverId,
    tripId,
    userId: null,
    description: `Driver ${driverId} cancelled trip ${tripId} after accepting`,
    metadata: {
      tripId,
      driverId,
      cancelledBy: "DRIVER",
      reason: reason ?? "Driver cancelled",
      previousStatus: trip.status,
      willReassign: true,
    },
  }).catch((err) => logger.error("Failed to log driver cancel activity", { error: err }));

  // Import dynamically to avoid circular dependency
  const { tripDispatchService } = await import("./tripDispatch.service");
  
  // Trigger reassignment
  await tripDispatchService.startDispatchForTrip(tripId);

  logger.info("Trip cancelled by driver, reassignment initiated", {
    tripId,
    driverId,
  });

  return {
    success: true,
    message: "Trip cancelled and reassignment initiated",
    tripId,
  };
}

export interface ReassignDriverInput {
  driverId: string;
  franchiseId?: string;
}

export async function reassignDriverToTrip(
  tripId: string,
  input: ReassignDriverInput,
  assignedBy?: string
) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.TRIP_NOT_FOUND);
    err.statusCode = 404;
    throw err;
  }

  if (!(REASSIGNABLE_TRIP_STATUSES as readonly string[]).includes(trip.status)) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.REASSIGN_NOT_ALLOWED);
    err.statusCode = 400;
    throw err;
  }

  if (!trip.driverId) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.TRIP_HAS_NO_DRIVER);
    err.statusCode = 400;
    throw err;
  }

  if (trip.driverId === input.driverId) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.REASSIGN_SAME_DRIVER);
    err.statusCode = 400;
    throw err;
  }

  const franchiseId = input.franchiseId ?? trip.franchiseId;
  if (trip.franchiseId !== franchiseId) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.INVALID_FRANCHISE);
    err.statusCode = 400;
    throw err;
  }

  const newDriver = await getDriverById(input.driverId);
  if (!newDriver) {
    const err: any = new Error("Driver not found");
    err.statusCode = 404;
    throw err;
  }

  await validateDriverForTripAssignment(newDriver, trip, franchiseId);

  const previousDriverId = trip.driverId;
  await updateDriverTripStatus(previousDriverId, "AVAILABLE");

  const updatedTrip = await updateTrip(tripId, {
    driverId: input.driverId,
    status: "ASSIGNED",
    updatedAt: new Date(),
  });

  await updateDriverTripStatus(input.driverId, "ON_TRIP");

  logActivity({
    action: ActivityAction.TRIP_ASSIGNED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId,
    driverId: input.driverId,
    tripId,
    userId: assignedBy ?? null,
    description: `Trip ${tripId} reassigned to driver ${newDriver.firstName} ${newDriver.lastName} (${newDriver.driverCode})`,
    metadata: {
      tripId,
      driverId: input.driverId,
      driverCode: newDriver.driverCode,
      previousDriverId,
      reassigned: true,
      customerName: trip.customerName,
      franchiseId,
    },
  }).catch((err) => logger.error("Failed to log reassign activity", { error: err }));

  // Emit real-time socket notification to new driver
  try {
    socketService.emitTripAssigned(input.driverId, {
      tripId: tripId,
    });
    logger.info("Socket notification sent for trip reassignment", {
      driverId: input.driverId,
      tripId,
      previousDriverId,
    });
  } catch (err) {
    logger.error("Failed to emit socket notification for trip reassignment", {
      error: err,
      driverId: input.driverId,
      tripId,
    });
  }

  return updatedTrip;
}

export async function generateStartOtpForTrip(
  tripId: string,
  driverId: string
) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  if (trip.driverId !== driverId) {
    const err: any = new Error("This trip is not assigned to this driver");
    err.statusCode = 403;
    throw err;
  }

  if (trip.status !== TripStatus.DRIVER_ACCEPTED) {
    const err: any = new Error("Trip is not in DRIVER_ACCEPTED state");
    err.statusCode = 400;
    throw err;
  }

  const otp = generateOtp(4);

  const updated = await updateTrip(tripId, {
    startOtp: otp,
  });

  // later: trigger SMS/WhatsApp here
  return { tripId: updated.id, otp };
}

interface StartTripInput {
  driverId: string;
  otp: string;
  odometerValue: number;
  carImageFront: string;
  carImageBack: string;
}

export async function startTripWithOtp(
  tripId: string,
  input: StartTripInput
) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  if (trip.driverId !== input.driverId) {
    const err: any = new Error("This trip is not assigned to this driver");
    err.statusCode = 403;
    throw err;
  }

  // Allow both ASSIGNED and DRIVER_ACCEPTED (legacy) statuses
  if (trip.status !== TripStatus.ASSIGNED && trip.status !== TripStatus.DRIVER_ACCEPTED) {
    const err: any = new Error("Trip is not in ASSIGNED state");
    err.statusCode = 400;
    throw err;
  }

  if (!trip.startOtp || trip.startOtp !== input.otp) {
    const err: any = new Error("Invalid start OTP");
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();

  const updatedTrip = await updateTrip(tripId, {
    startedAt: now,
    status: TripStatus.TRIP_STARTED,
    startOdometer: input.odometerValue,
    carImageFront: input.carImageFront,
    carImageBack: input.carImageBack,
  });
  
  // Ensure driver trip status is ON_TRIP
  await updateDriverTripStatus(input.driverId, "ON_TRIP");

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.TRIP_STARTED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: trip.franchiseId,
    driverId: input.driverId,
    tripId: tripId,
    description: `Trip ${tripId} started by driver`,
    metadata: {
      tripId: tripId,
      driverId: input.driverId,
      odometerValue: input.odometerValue,
      customerName: trip.customerName,
    },
  }).catch((err) => {
    logger.error("Failed to log trip start activity", { error: err });
  });
  
  return updatedTrip;
}

/**
 * Initiate trip start - generates OTP, token, and sends OTP to customer.
 * Trip ID comes from URL; driverId and franchiseId are derived from the trip.
 */
interface InitiateStartTripInput {
  tripId: string;
  odometerValue: number;
  odometerPic: string;
  carFrontPic: string;
  carBackPic: string;
  driverSelfie: string;
  startTime: Date;
}

export async function initiateStartTrip(input: InitiateStartTripInput) {
  const { tripId, odometerValue, odometerPic, carFrontPic, carBackPic, driverSelfie, startTime } = input;
  
  // Validate trip exists
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  const driverId = trip.driverId;
  const franchiseId = trip.franchiseId;

  if (!driverId) {
    const err: any = new Error("Trip has no driver assigned");
    err.statusCode = 400;
    throw err;
  }

  // Validate trip status
  if (trip.status !== TripStatus.ASSIGNED && trip.status !== TripStatus.DRIVER_ACCEPTED) {
    const err: any = new Error(`Trip is not in a valid status for starting. Current status: ${trip.status}`);
    err.statusCode = 400;
    throw err;
  }

  // Generate OTP
  const otp = generateOtp(4);

  // Generate JWT token with trip info and OTP hash
  const tokenPayload = {
    tripId,
    driverId,
    franchiseId,
    otpHash: otp, // In production, hash this
    type: "trip-start-verification",
    timestamp: Date.now(),
  };

  const token = jwt.sign(tokenPayload, authConfig.jwtSecret, {
    expiresIn: "10m", // Token expires in 10 minutes
  });

  // Store OTP and image data in trip
  await updateTrip(tripId, {
    startOtp: otp,
    startOdometer: odometerValue,
    carImageFront: carFrontPic,
    carImageBack: carBackPic,
    odometerStartImageUrl: odometerPic,
    driverSelfieUrl: driverSelfie,
    startTime: startTime,
  });

  // Send OTP to customer via email
  if (trip.customerEmail) {
    try {
      // Get driver name if available
      let driverName: string | undefined;
      if (trip.Driver) {
        driverName = `${trip.Driver.firstName} ${trip.Driver.lastName}`.trim();
      }

      await sendTripStartOtpEmail({
        to: trip.customerEmail,
        customerName: trip.customerName,
        otp,
        tripId,
        pickupAddress: trip.pickupAddress || undefined,
        driverName,
      });

      logger.info("Trip start OTP email sent to customer", {
        tripId,
        customerEmail: trip.customerEmail,
        customerName: trip.customerName,
        otpSent: true,
      });
    } catch (error) {
      // Log error but don't fail the request - email failure shouldn't block trip initiation
      logger.error("Failed to send trip start OTP email", {
        error: error instanceof Error ? error.message : String(error),
        tripId,
        customerEmail: trip.customerEmail,
      });
    }
  } else {
    logger.warn("Customer email not available, OTP email not sent", {
      tripId,
      customerPhone: trip.customerPhone,
      customerName: trip.customerName,
    });
  }

  // TODO: Also send OTP via SMS/WhatsApp if customer phone is available
  // await sendSms(trip.customerPhone, `Your trip start OTP is: ${otp}`);
  // or
  // await sendWhatsApp(trip.customerPhone, `Your trip start OTP is: ${otp}`);

  return {
    token,
    tripId,
    message: trip.customerEmail 
      ? "OTP sent to customer via email. Please verify with token and OTP to start trip."
      : "OTP generated. Customer email not available. Please verify with token and OTP to start trip.",
    emailSent: !!trip.customerEmail,
  };
}

/**
 * Verify token and OTP, then start the trip
 */
interface VerifyStartTripInput {
  tripId: string;
  token: string;
  otp: string;
}

export async function verifyAndStartTrip(input: VerifyStartTripInput) {
  const { tripId, token, otp } = input;

  // Verify JWT token
  let decoded: any;
  try {
    decoded = jwt.verify(token, authConfig.jwtSecret);
  } catch (err) {
    const error: any = new Error("Invalid or expired token");
    error.statusCode = 401;
    throw error;
  }

  // Validate token type
  if (decoded.type !== "trip-start-verification") {
    const err: any = new Error("Invalid token type");
    err.statusCode = 400;
    throw err;
  }

  // Validate trip ID matches
  if (decoded.tripId !== tripId) {
    const err: any = new Error("Token trip ID does not match");
    err.statusCode = 400;
    throw err;
  }

  // Get trip
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  // Verify OTP matches
  if (!trip.startOtp || trip.startOtp !== otp) {
    const err: any = new Error("Invalid OTP");
    err.statusCode = 400;
    throw err;
  }

  // Validate trip status hasn't changed
  if (trip.status !== TripStatus.ASSIGNED && trip.status !== TripStatus.DRIVER_ACCEPTED) {
    const err: any = new Error(`Trip status has changed. Current status: ${trip.status}`);
    err.statusCode = 400;
    throw err;
  }

  // Start the trip
  const now = new Date();
  const updatedTrip = await updateTrip(tripId, {
    startedAt: now,
    status: TripStatus.TRIP_STARTED,
    // Odometer and images already stored in initiateStartTrip
    startOtp: null, // Clear OTP after successful verification
  });

  // Update driver trip status to ON_TRIP
  await updateDriverTripStatus(decoded.driverId, "ON_TRIP");

  // Check for late report penalty (if trip was scheduled)
  if (trip.scheduledAt) {
    try {
      const delayMinutes = (now.getTime() - trip.scheduledAt.getTime()) / 60000;
      
      // Import penalty repository
      const { default: penaltyRepository } = await import('../repositories/penalty.repository');
      
      // Find late report penalty
      const lateReportPenalty = await penaltyRepository.findByTriggerType('LATE_REPORT');
      
      if (lateReportPenalty && lateReportPenalty.isActive) {
        const triggerConfig = lateReportPenalty.triggerConfig as any;
        const delayThreshold = triggerConfig?.delayMinutes || 5;
        
        if (delayMinutes > delayThreshold) {
          // Import deduction service
          const { default: deductionService } = await import('./deduction.service');
          const { Decimal } = await import('@prisma/client/runtime/library');
          
          logger.warn(
            `Late report detected: Trip ${tripId}, Driver ${decoded.driverId}, Delay: ${delayMinutes.toFixed(1)} minutes`
          );
          
          // Apply late report penalty
          await deductionService.applyDeduction({
            penaltyId: lateReportPenalty.id,
            driverId: decoded.driverId,
            amount: lateReportPenalty.amount,
            reason: `Trip started ${Math.floor(delayMinutes)} minutes late (scheduled at ${trip.scheduledAt.toLocaleString()})`,
            tripId: trip.id,
            appliedBy: decoded.driverId, // Self-applied by driver action
          });
        }
      }
    } catch (error) {
      // Log error but don't fail trip start
      logger.error(`Error checking late report penalty: ${error}`);
    }
  }

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.TRIP_STARTED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: trip.franchiseId,
    driverId: decoded.driverId,
    tripId: tripId,
    description: `Trip ${tripId} started by driver after OTP verification`,
    metadata: {
      tripId: tripId,
      driverId: decoded.driverId,
      odometerValue: trip.startOdometer,
      customerName: trip.customerName,
    },
  }).catch((err) => {
    logger.error("Failed to log trip start activity", { error: err });
  });

  return updatedTrip;
}

/**
 * Initiate trip end - generates OTP, token, and sends OTP to customer.
 * Trip ID comes from URL; driverId and franchiseId are derived from the trip.
 */
interface InitiateEndTripInput {
  tripId: string;
  odometerValue: number;
  odometerImage: string;
  endTime: Date;
}

export async function initiateEndTrip(input: InitiateEndTripInput) {
  const { tripId, odometerValue, odometerImage, endTime } = input;
  
  // Validate trip exists
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  const driverId = trip.driverId;
  const franchiseId = trip.franchiseId;

  if (!driverId) {
    const err: any = new Error("Trip has no driver assigned");
    err.statusCode = 400;
    throw err;
  }

  // Validate trip status - must be started
  if (trip.status !== TripStatus.TRIP_STARTED && trip.status !== TripStatus.TRIP_PROGRESS && trip.status !== TripStatus.IN_PROGRESS) {
    const err: any = new Error(`Trip is not in a valid status for ending. Current status: ${trip.status}`);
    err.statusCode = 400;
    throw err;
  }

  // Validate trip has been started
  if (!trip.startedAt) {
    const err: any = new Error("Trip has not been started yet");
    err.statusCode = 400;
    throw err;
  }

  // Validate start odometer exists
  if (!trip.startOdometer) {
    const err: any = new Error("Start odometer reading is missing");
    err.statusCode = 400;
    throw err;
  }

  // Generate OTP
  const otp = generateOtp(4);

  // Generate JWT token with trip info and OTP hash
  const tokenPayload = {
    tripId,
    driverId,
    franchiseId,
    otpHash: otp, // In production, hash this
    type: "trip-end-verification",
    timestamp: Date.now(),
  };

  const token = jwt.sign(tokenPayload, authConfig.jwtSecret, {
    expiresIn: "10m", // Token expires in 10 minutes
  });

  // Store OTP and end odometer data
  await updateTrip(tripId, {
    endOtp: otp,
    endOdometer: odometerValue,
    odometerEndImageUrl: odometerImage,
    endTime: endTime,
  });

  // Send OTP to customer via email
  if (trip.customerEmail) {
    try {
      // Get driver name if available
      let driverName: string | undefined;
      if (trip.Driver) {
        driverName = `${trip.Driver.firstName} ${trip.Driver.lastName}`.trim();
      }

      await sendTripEndOtpEmail({
        to: trip.customerEmail,
        customerName: trip.customerName,
        otp,
        tripId,
        dropAddress: trip.dropAddress || undefined,
        driverName,
      });

      logger.info("Trip end OTP email sent to customer", {
        tripId,
        customerEmail: trip.customerEmail,
        customerName: trip.customerName,
        otpSent: true,
      });
    } catch (error) {
      // Log error but don't fail the request - email failure shouldn't block trip end initiation
      logger.error("Failed to send trip end OTP email", {
        error: error instanceof Error ? error.message : String(error),
        tripId,
        customerEmail: trip.customerEmail,
      });
    }
  } else {
    logger.warn("Customer email not available, OTP email not sent", {
      tripId,
      customerPhone: trip.customerPhone,
      customerName: trip.customerName,
    });
  }

  return {
    token,
    tripId,
    message: trip.customerEmail 
      ? "OTP sent to customer via email. Please verify with token and OTP to end trip."
      : "OTP generated. Customer email not available. Please verify with token and OTP to end trip.",
    emailSent: !!trip.customerEmail,
  };
}

/**
 * Get driver earnings config with priority: driver > franchise > global
 */
async function getDriverEarningsConfigWithPriority(driverId: string, franchiseId: string) {
  // Check driver-specific config
  let config = await getDriverEarningsConfigByDriver(driverId);
  if (config) {
    logger.info("Using driver-specific earnings config", { driverId });
    return config;
  }

  // Check franchise-specific config
  config = await getDriverEarningsConfigByFranchise(franchiseId);
  if (config) {
    logger.info("Using franchise-specific earnings config", { franchiseId });
    return config;
  }

  // Use global config
  config = await getDriverEarningsConfig();
  if (config) {
    logger.info("Using global earnings config");
    return config;
  }

  // Return default config if none found
  logger.warn("No earnings config found, using defaults");
  return {
    dailyTargetDefault: 1250,
    incentiveTier1Min: 1250,
    incentiveTier1Max: 1550,
    incentiveTier1Type: "full_extra",
    incentiveTier2Min: 1550,
    incentiveTier2Percent: 20,
  };
}

/**
 * Calculate today's total earnings for a driver
 */
async function calculateTodayEarnings(driverId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const trips = await prisma.trip.findMany({
    where: {
      driverId,
      status: TripStatus.COMPLETED,
      completedAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    select: {
      totalAmount: true,
    },
  });

  const total = trips.reduce((sum, trip) => sum + trip.totalAmount, 0);
  logger.info("Calculated today's earnings", { driverId, total, tripCount: trips.length });
  return total;
}

/**
 * Calculate daily incentive based on earnings config
 */
function calculateDailyIncentive(todayEarnings: number, config: any): number {
  const dailyTarget = config.dailyTargetDefault || 1250;
  const tier1Max = config.incentiveTier1Max || 1550;
  const tier2Percent = config.incentiveTier2Percent || 20;

  let incentive = 0;

  if (todayEarnings < dailyTarget) {
    // Below target, no incentive
    incentive = 0;
  } else if (todayEarnings <= tier1Max) {
    // Between target and tier1Max: full extra
    incentive = todayEarnings - dailyTarget;
  } else {
    // Above tier1Max: percentage of total earnings
    incentive = todayEarnings * (tier2Percent / 100);
  }

  logger.info("Calculated daily incentive", {
    todayEarnings,
    dailyTarget,
    tier1Max,
    tier2Percent,
    incentive,
  });

  return Math.round(incentive * 100) / 100; // Round to 2 decimal places
}

/**
 * Verify token and OTP, then end the trip and calculate amount
 */
interface VerifyEndTripInput {
  tripId: string;
  token: string;
  otp: string;
}

export async function verifyAndEndTrip(input: VerifyEndTripInput) {
  const { tripId, token, otp } = input;

  // Verify JWT token
  let decoded: any;
  try {
    decoded = jwt.verify(token, authConfig.jwtSecret);
  } catch (err) {
    const error: any = new Error("Invalid or expired token");
    error.statusCode = 401;
    throw error;
  }

  // Validate token type
  if (decoded.type !== "trip-end-verification") {
    const err: any = new Error("Invalid token type");
    err.statusCode = 400;
    throw err;
  }

  // Validate trip ID matches
  if (decoded.tripId !== tripId) {
    const err: any = new Error("Token trip ID does not match");
    err.statusCode = 400;
    throw err;
  }

  // Get trip with all relations
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  // Verify OTP matches
  if (!trip.endOtp || trip.endOtp !== otp) {
    const err: any = new Error("Invalid OTP");
    err.statusCode = 400;
    throw err;
  }

  // Validate trip status hasn't changed
  if (trip.status !== TripStatus.TRIP_STARTED && trip.status !== TripStatus.TRIP_PROGRESS && trip.status !== TripStatus.IN_PROGRESS) {
    const err: any = new Error(`Trip status has changed. Current status: ${trip.status}`);
    err.statusCode = 400;
    throw err;
  }

  // Validate required data exists
  if (!trip.startedAt) {
    const err: any = new Error("Trip start time is missing");
    err.statusCode = 400;
    throw err;
  }

  if (!trip.startOdometer) {
    const err: any = new Error("Start odometer reading is missing");
    err.statusCode = 400;
    throw err;
  }

  if (!trip.endOdometer) {
    const err: any = new Error("End odometer reading is missing");
    err.statusCode = 400;
    throw err;
  }

  // Validate that startTime and endTime are present
  if (!trip.startTime) {
    const err: any = new Error("Trip start time is missing. Please ensure the trip was started with a valid start time.");
    err.statusCode = 400;
    throw err;
  }

  if (!trip.endTime) {
    const err: any = new Error("Trip end time is missing. Please ensure the trip was ended with a valid end time.");
    err.statusCode = 400;
    throw err;
  }

  // Calculate distance traveled (in km)
  const distanceTraveled = trip.endOdometer - trip.startOdometer;
  if (distanceTraveled < 0) {
    const err: any = new Error("End odometer reading cannot be less than start odometer reading");
    err.statusCode = 400;
    throw err;
  }

  // Calculate time taken (in hours) using actual startTime and endTime
  const timeTakenMs = trip.endTime.getTime() - trip.startTime.getTime();
  const timeTakenHours = timeTakenMs / (1000 * 60 * 60); // Convert milliseconds to hours

  // Get trip type as string for pricing calculation
  const tripType = trip.tripType as any;

  // Get car type from driver if available
  let carType: "PREMIUM" | "LUXURY" | "NORMAL" | undefined;
  if (trip.Driver?.carTypes) {
    try {
      const carTypes = JSON.parse(trip.Driver.carTypes);
      const firstCarType = Array.isArray(carTypes) ? carTypes[0] : carTypes;
      const driverCarType = String(firstCarType).toUpperCase();
      if (driverCarType === "PREMIUM" || driverCarType === "LUXURY") {
        carType = driverCarType as "PREMIUM" | "LUXURY";
      } else {
        carType = "NORMAL";
      }
    } catch (e) {
      carType = "NORMAL";
    }
  }

  // Calculate trip amount using pricing service
  let calculatedAmount = 0;
  let priceBreakdown: any = null;
  let tripTypeConfig: any = null;
  try {
    const priceResult = await calculateTripPrice({
      tripType,
      distance: distanceTraveled,
      duration: timeTakenHours,
      carType,
    });
    calculatedAmount = priceResult.totalPrice;
    priceBreakdown = priceResult.breakdown;
    tripTypeConfig = priceResult.tripTypeConfig;

    logger.info("Trip price calculated successfully", {
      tripId,
      tripType,
      distanceTraveled,
      timeTakenHours,
      calculatedAmount,
      basePrice: priceResult.basePrice,
      extraCharges: priceResult.extraCharges,
      breakdown: priceBreakdown,
      tripTypeConfig,
    });
  } catch (error) {
    logger.error("Failed to calculate trip price", {
      error: error instanceof Error ? error.message : String(error),
      tripId,
      tripType,
      distanceTraveled,
      timeTakenHours,
    });
    // Use existing totalAmount as fallback
    calculatedAmount = trip.totalAmount;
  }

  // Update trip with calculated amount but don't end it yet - wait for payment
  await updateTrip(tripId, {
    finalAmount: calculatedAmount,
    totalAmount: calculatedAmount, // Update total amount with calculated value
    endOtp: null, // Clear OTP after successful verification
    status: TripStatus.TRIP_PROGRESS, // Keep trip in progress until payment is verified
  });

  // Create driver transactions and update incentives
  try {
    // 1. Create trip earning transaction
    await createDriverTransaction({
      driverId: trip.driverId!,
      amount: calculatedAmount,
      transactionType: TransactionType.CREDIT,
      type: DriverTransactionType.TRIP,
      tripId: trip.id,
      description: `Trip earning for ${tripType}`,
    });

    logger.info("Created trip earning transaction", {
      driverId: trip.driverId,
      amount: calculatedAmount,
      tripId: trip.id,
    });

    // 2. Update remaining daily limit
    const driver = await getDriverById(trip.driverId!);
    if (driver && driver.remainingDailyLimit !== null) {
      const currentLimit = Number(driver.remainingDailyLimit);
      let newLimit = 0;

      if (currentLimit > 0) {
        if (currentLimit >= calculatedAmount) {
          newLimit = currentLimit - calculatedAmount;
        } else {
          newLimit = 0;
        }
      }

      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          remainingDailyLimit: newLimit,
        },
      });

      logger.info("Updated remaining daily limit", {
        driverId: driver.id,
        previousLimit: currentLimit,
        newLimit,
        tripAmount: calculatedAmount,
      });
    }

    // 3. Calculate and update daily incentive
    const todayEarnings = await calculateTodayEarnings(trip.driverId!);
    const earningsConfig = await getDriverEarningsConfigWithPriority(
      trip.driverId!,
      trip.franchiseId
    );
    const incentive = calculateDailyIncentive(todayEarnings, earningsConfig);

    // Update driver's incentive field
    await prisma.driver.update({
      where: { id: trip.driverId! },
      data: {
        incentive: incentive,
      },
    });

    logger.info("Updated driver incentive", {
      driverId: trip.driverId,
      todayEarnings,
      incentive,
    });

    // 4. Create incentive transaction if incentive > 0
    if (incentive > 0) {
      await createDriverTransaction({
        driverId: trip.driverId!,
        amount: incentive,
        transactionType: TransactionType.CREDIT,
        type: DriverTransactionType.GIFT,
        description: "Daily incentive",
      });

      logger.info("Created incentive transaction", {
        driverId: trip.driverId,
        amount: incentive,
      });
    }
  } catch (transactionError) {
    logger.error("Failed to create driver transactions or update incentive", {
      error: transactionError instanceof Error ? transactionError.message : String(transactionError),
      tripId,
      driverId: trip.driverId,
    });
    // Continue execution - don't fail the trip end if transaction creation fails
  }

  // Return calculated values with detailed breakdown
  return {
    totalAmount: calculatedAmount,
    distanceTraveled: Math.round(distanceTraveled * 100) / 100, // Round to 2 decimal places
    timeTakenHours: Math.round(timeTakenHours * 100) / 100, // Round to 2 decimal places
    timeTakenMinutes: Math.round((timeTakenHours * 60) * 100) / 100,
    tripType,
    calculatedAmount,
    priceBreakdown, // Include breakdown for frontend display
    tripTypeConfig, // Include trip type configuration details
  };
}

/**
 * Collect payment information from customer
 */
interface CollectPaymentInput {
  tripId: string;
  driverId: string;
  paymentMethod: "UPI" | "CASH" | "BOTH";
  upiAmount?: number;
  cashAmount?: number;
  upiReference?: string; // UPI transaction reference/ID
}

export async function collectPayment(input: CollectPaymentInput) {
  const { tripId, driverId, paymentMethod, upiAmount, cashAmount, upiReference } = input;

  // Validate trip exists
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  // Validate driver matches
  if (trip.driverId !== driverId) {
    const err: any = new Error("This trip is not assigned to this driver");
    err.statusCode = 403;
    throw err;
  }

  // Validate trip status - must be in progress (after end-verify)
  if (trip.status !== TripStatus.TRIP_PROGRESS && trip.status !== TripStatus.TRIP_STARTED && trip.status !== TripStatus.IN_PROGRESS) {
    const err: any = new Error(`Trip is not in a valid status for payment collection. Current status: ${trip.status}`);
    err.statusCode = 400;
    throw err;
  }

  // Validate payment method and amounts
  let totalPaid = 0;
  let paymentMode: PaymentMode;
  let paymentRef: string | null = null;

  if (paymentMethod === "UPI") {
    if (!upiAmount || upiAmount <= 0) {
      const err: any = new Error("UPI amount is required and must be greater than 0");
      err.statusCode = 400;
      throw err;
    }
    totalPaid = upiAmount;
    paymentMode = PaymentMode.UPI;
    paymentRef = upiReference || null;
  } else if (paymentMethod === "CASH") {
    if (!cashAmount || cashAmount <= 0) {
      const err: any = new Error("Cash amount is required and must be greater than 0");
      err.statusCode = 400;
      throw err;
    }
    totalPaid = cashAmount;
    paymentMode = PaymentMode.IN_HAND;
  } else if (paymentMethod === "BOTH") {
    if (!upiAmount || upiAmount <= 0) {
      const err: any = new Error("UPI amount is required and must be greater than 0 when payment method is BOTH");
      err.statusCode = 400;
      throw err;
    }
    if (!cashAmount || cashAmount <= 0) {
      const err: any = new Error("Cash amount is required and must be greater than 0 when payment method is BOTH");
      err.statusCode = 400;
      throw err;
    }
    totalPaid = upiAmount + cashAmount;
    paymentMode = PaymentMode.UPI; // Primary mode, split info stored in paymentReference
    // Store split payment info as JSON in paymentReference
    paymentRef = JSON.stringify({
      upiAmount,
      cashAmount,
      upiReference: upiReference || null,
    });
  } else {
    const err: any = new Error("Invalid payment method. Must be UPI, CASH, or BOTH");
    err.statusCode = 400;
    throw err;
  }

  // Validate total paid matches trip amount
  const tripAmount = trip.finalAmount || trip.totalAmount;
  if (Math.abs(totalPaid - tripAmount) > 0.01) { // Allow small rounding differences
    const err: any = new Error(`Payment amount (${totalPaid}) does not match trip amount (${tripAmount})`);
    err.statusCode = 400;
    throw err;
  }

  // Update trip with payment information
  const updatedTrip = await updateTrip(tripId, {
    paymentMode,
    paymentReference: paymentRef,
    paymentStatus: PaymentStatus.COMPLETED,
    // Store split payment amounts in overrideReason field temporarily (can be moved to dedicated field later)
    overrideReason: paymentMethod === "BOTH" 
      ? `Split payment: UPI ₹${upiAmount}, Cash ₹${cashAmount}` 
      : null,
  });

  // Handle cash in hand and daily limit updates
  try {
    // If payment includes cash (CASH or BOTH), add to driver's cash in hand
    if (paymentMethod === "CASH" || paymentMethod === "BOTH") {
      const cashToAdd = paymentMethod === "CASH" ? cashAmount! : cashAmount!;
      await addCashInHand(driverId, cashToAdd);
      logger.info("Cash added to driver's cash in hand", {
        driverId,
        cashAmount: cashToAdd,
        tripId,
      });
    }

    // Reduce trip amount from driver's remaining daily limit
    await reduceRemainingDailyLimit(driverId, tripAmount);
    logger.info("Daily limit reduced for driver", {
      driverId,
      tripAmount,
      tripId,
    });
  } catch (err: any) {
    // Log error but don't fail the payment collection
    logger.error("Failed to update driver cash/daily limit", {
      error: err,
      driverId,
      tripId,
    });
  }

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.TRIP_UPDATED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: trip.franchiseId,
    driverId: driverId,
    tripId: tripId,
    description: `Payment collected for trip ${tripId}`,
    metadata: {
      tripId: tripId,
      driverId: driverId,
      paymentMethod,
      totalPaid,
      upiAmount: paymentMethod === "UPI" || paymentMethod === "BOTH" ? upiAmount : null,
      cashAmount: paymentMethod === "CASH" || paymentMethod === "BOTH" ? cashAmount : null,
    },
  }).catch((err) => {
    logger.error("Failed to log payment collection activity", { error: err });
  });

  return {
    tripId: updatedTrip.id,
    paymentMethod,
    totalPaid,
    upiAmount: paymentMethod === "UPI" || paymentMethod === "BOTH" ? upiAmount : null,
    cashAmount: paymentMethod === "CASH" || paymentMethod === "BOTH" ? cashAmount : null,
    paymentStatus: "COMPLETED",
    message: "Payment collected successfully. Please verify payment to end trip.",
  };
}

/**
 * Verify payment and end trip - sends email with review form
 */
interface VerifyPaymentAndEndTripInput {
  tripId: string;
  driverId: string;
}

export async function verifyPaymentAndEndTrip(input: VerifyPaymentAndEndTripInput) {
  const { tripId, driverId } = input;

  // Validate trip exists
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  // Validate driver matches
  if (trip.driverId !== driverId) {
    const err: any = new Error("This trip is not assigned to this driver");
    err.statusCode = 403;
    throw err;
  }

  // Validate payment is completed
  if (trip.paymentStatus !== PaymentStatus.COMPLETED) {
    const err: any = new Error("Payment not completed. Please collect payment first.");
    err.statusCode = 400;
    throw err;
  }

  // Validate trip status
  if (trip.status !== TripStatus.TRIP_PROGRESS && trip.status !== TripStatus.TRIP_STARTED && trip.status !== TripStatus.IN_PROGRESS) {
    const err: any = new Error(`Trip is not in a valid status for ending. Current status: ${trip.status}`);
    err.statusCode = 400;
    throw err;
  }

  // End the trip
  const now = new Date();
  const updatedTrip = await updateTrip(tripId, {
    endedAt: now,
    status: TripStatus.TRIP_ENDED,
  });

  // Update driver trip status to AVAILABLE
  await updateDriverTripStatus(driverId, "AVAILABLE");

  // Create driver transaction for trip earning
  try {
    const tripAmount = trip.finalAmount || trip.totalAmount;
    await createTripEarningTransaction(
      driverId,
      tripId,
      tripAmount,
      `Trip earning for trip ${tripId}`
    );
    logger.info("Driver transaction created for trip earning", {
      tripId,
      driverId,
      amount: tripAmount,
    });
  } catch (error) {
    // Log error but don't fail the trip end - transaction creation is not critical
    logger.error("Failed to create driver transaction for trip earning", {
      error: error instanceof Error ? error.message : String(error),
      tripId,
      driverId,
    });
  }

  // Send trip end email with review form
  if (trip.customerEmail) {
    try {
      // Get driver name if available
      let driverName: string | undefined;
      if (trip.Driver) {
        driverName = `${trip.Driver.firstName} ${trip.Driver.lastName}`.trim();
      }

      await sendTripEndConfirmationEmail({
        to: trip.customerEmail,
        customerName: trip.customerName,
        tripId,
        driverName,
        driverId: driverId,
        tripAmount: trip.finalAmount || trip.totalAmount,
        pickupAddress: trip.pickupAddress || trip.pickupLocation,
        dropAddress: trip.dropAddress || trip.dropLocation,
        startedAt: trip.startedAt,
        endedAt: now,
      });

      logger.info("Trip end confirmation email sent to customer", {
        tripId,
        customerEmail: trip.customerEmail,
        customerName: trip.customerName,
      });
    } catch (error) {
      // Log error but don't fail the request - email failure shouldn't block trip ending
      logger.error("Failed to send trip end confirmation email", {
        error: error instanceof Error ? error.message : String(error),
        tripId,
        customerEmail: trip.customerEmail,
      });
    }
  }

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.TRIP_ENDED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: trip.franchiseId,
    driverId: driverId,
    tripId: tripId,
    description: `Trip ${tripId} ended after payment verification`,
    metadata: {
      tripId: tripId,
      driverId: driverId,
      paymentStatus: trip.paymentStatus,
      paymentMode: trip.paymentMode,
      finalAmount: trip.finalAmount || trip.totalAmount,
    },
  }).catch((err) => {
    logger.error("Failed to log trip end activity", { error: err });
  });

  // Update driver daily metrics (non-blocking)
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await calculateAndSaveDriverDailyMetrics(driverId, today);
    logger.info("Driver daily metrics updated after trip completion", {
      tripId,
      driverId,
      date: today.toISOString(),
    });
  } catch (error) {
    // Log error but don't fail the trip end - metrics update is not critical
    logger.error("Failed to update driver daily metrics after trip completion", {
      error: error instanceof Error ? error.message : String(error),
      tripId,
      driverId,
    });
  }

  return {
    tripId: updatedTrip.id,
    status: "TRIP_ENDED",
    message: "Trip ended successfully. Confirmation email sent to customer.",
    emailSent: !!trip.customerEmail,
  };
}

/**
 * End trip directly with price calculation (for testing purposes)
 * This endpoint allows ending a trip and calculates the final amount based on odometer readings
 */
interface EndTripDirectInput {
  tripId: string;
  driverId: string;
  endOdometer: number;
  endTime?: Date; // Optional custom end time for testing
  carImageFront?: string; // Optional front car image URL
  carImageBack?: string; // Optional back car image URL
}

export async function endTripDirect(input: EndTripDirectInput) {
  const { tripId, driverId, endOdometer, endTime, carImageFront, carImageBack } = input;

  // Validate trip exists
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  // Validate driver matches
  if (trip.driverId !== driverId) {
    const err: any = new Error("This trip is not assigned to this driver");
    err.statusCode = 403;
    throw err;
  }

  // Validate trip has been started
  if (!trip.startedAt) {
    const err: any = new Error("Trip has not been started yet");
    err.statusCode = 400;
    throw err;
  }

  // Validate start odometer exists
  if (!trip.startOdometer) {
    const err: any = new Error("Start odometer reading is missing");
    err.statusCode = 400;
    throw err;
  }

  // Validate end odometer
  if (endOdometer < trip.startOdometer) {
    const err: any = new Error("End odometer reading cannot be less than start odometer reading");
    err.statusCode = 400;
    throw err;
  }

  // Calculate distance traveled (in km)
  const distanceTraveled = endOdometer - trip.startOdometer;

  // Calculate time taken (in hours)
  const endDateTime = endTime || new Date();
  const timeTakenMs = endDateTime.getTime() - trip.startedAt.getTime();
  const timeTakenHours = timeTakenMs / (1000 * 60 * 60);

  // Get trip type
  const tripType = trip.tripType as any; // Use string type for compatibility

  // Get car type from driver if available
  let carType: "PREMIUM" | "LUXURY" | "NORMAL" | undefined;
  if (trip.Driver?.carTypes) {
    try {
      const carTypes = JSON.parse(trip.Driver.carTypes);
      const firstCarType = Array.isArray(carTypes) ? carTypes[0] : carTypes;
      const driverCarType = String(firstCarType).toUpperCase();
      if (driverCarType === "PREMIUM" || driverCarType === "LUXURY") {
        carType = driverCarType as "PREMIUM" | "LUXURY";
      } else {
        carType = "NORMAL";
      }
    } catch (e) {
      carType = "NORMAL";
    }
  }

  // Calculate trip amount using pricing service
  let calculatedAmount = 0;
  let priceBreakdown: any = null;
  try {
    const priceResult = await calculateTripPrice({
      tripType,
      distance: distanceTraveled,
      duration: timeTakenHours,
      carType,
    });
    calculatedAmount = priceResult.totalPrice;
    priceBreakdown = priceResult.breakdown;
  } catch (error) {
    logger.error("Failed to calculate trip price", {
      error: error instanceof Error ? error.message : String(error),
      tripId,
      tripType,
      distanceTraveled,
      timeTakenHours,
    });
    // Use existing totalAmount as fallback
    calculatedAmount = trip.totalAmount;
  }

  // Update trip with end details and calculated amount
  const updateData: any = {
    endOdometer,
    endedAt: endDateTime,
    finalAmount: calculatedAmount,
    totalAmount: calculatedAmount,
    status: TripStatus.TRIP_ENDED,
    paymentStatus: PaymentStatus.COMPLETED, // Mark as completed for testing
  };

  if (carImageFront) {
    updateData.carImageFront = carImageFront;
  }
  if (carImageBack) {
    updateData.carImageBack = carImageBack;
  }

  const updatedTrip = await updateTrip(tripId, updateData);

  // Update driver trip status to AVAILABLE
  await updateDriverTripStatus(driverId, "AVAILABLE");

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.TRIP_ENDED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: trip.franchiseId,
    driverId: driverId,
    tripId: tripId,
    description: `Trip ${tripId} ended directly (testing endpoint)`,
    metadata: {
      tripId,
      driverId,
      distanceTraveled,
      timeTakenHours,
      calculatedAmount,
      endOdometer,
    },
  }).catch((err) => {
    logger.error("Failed to log trip end activity", { error: err });
  });

  return {
    tripId,
    status: updatedTrip.status,
    finalAmount: calculatedAmount,
    distanceTraveled: Math.round(distanceTraveled * 100) / 100,
    timeTakenHours: Math.round(timeTakenHours * 100) / 100,
    timeTakenMinutes: Math.round((timeTakenHours * 60) * 100) / 100,
    priceBreakdown,
    tripType,
    carType,
    message: "Trip ended successfully with price calculation",
  };
}

/**
 * Get trip history for a driver - returns timeline of all events
 */
export async function getTripHistory(tripId: string, driverId: string) {
  // Validate trip exists
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  // Validate driver matches
  if (trip.driverId !== driverId) {
    const err: any = new Error("This trip is not assigned to this driver");
    err.statusCode = 403;
    throw err;
  }

  // Get all activity logs for this trip
  const activityLogs = await getActivityLogsByTripId(tripId);

  // Build timeline from activity logs and trip data
  const timeline: any[] = [];
  let startedLate = false;
  let lateByMinutes: number | null = null;

  // Map activity actions to user-friendly event names
  const eventMap: Record<string, string> = {
    TRIP_CREATED: "Trip Created",
    TRIP_ASSIGNED: "Request Accepted",
    TRIP_ACCEPTED: "Request Accepted",
    TRIP_STARTED: "Trip Started",
    TRIP_ENDED: "Trip Ended",
    TRIP_UPDATED: "Trip Updated",
    TRIP_STATUS_CHANGED: "Status Changed",
  };

  // Add events from activity logs
  activityLogs.forEach((log) => {
    const eventName = eventMap[log.action] || log.action;
    
    // Map specific events
    let eventType = "";
    let description = log.description;
    
    if (log.action === "TRIP_ASSIGNED" || log.action === "TRIP_ACCEPTED") {
      eventType = "request_accepted";
      description = "Driver accepted the trip request";
    } else if (log.action === "TRIP_STARTED") {
      eventType = "trip_started";
      description = "Trip started successfully";
    } else if (log.action === "TRIP_ENDED") {
      eventType = "trip_ended";
      description = "Trip ended successfully";
    } else if (log.action === "TRIP_UPDATED") {
      // Check metadata to determine if it's payment related
      const metadata = log.metadata as any;
      if (metadata?.paymentMethod) {
        eventType = "payment_initiated";
        description = `Payment collected: ${metadata.paymentMethod}`;
      } else {
        eventType = "trip_updated";
      }
    }

    timeline.push({
      eventType: eventType || log.action.toLowerCase(),
      eventName,
      description,
      timestamp: log.createdAt,
      metadata: log.metadata,
    });
  });

  // Add events based on trip status and timestamps
  if (trip.createdAt) {
    timeline.push({
      eventType: "trip_created",
      eventName: "Trip Created",
      description: "Trip was created",
      timestamp: trip.createdAt,
    });
  }

  // Request accepted - when trip is assigned or driver accepts
  if (trip.status === "ASSIGNED" || trip.status === "DRIVER_ACCEPTED") {
    const existingEvent = timeline.find(e => e.eventType === "request_accepted");
    if (!existingEvent && trip.updatedAt) {
      timeline.push({
        eventType: "request_accepted",
        eventName: "Request Accepted",
        description: "Driver accepted the trip request",
        timestamp: trip.updatedAt,
      });
    }
  }

  // Trip initiated/started
  if (trip.startedAt) {
    const existingEvent = timeline.find(e => e.eventType === "trip_started");
    if (!existingEvent) {
      timeline.push({
        eventType: "trip_started",
        eventName: "Trip Started",
        description: "Trip started successfully",
        timestamp: trip.startedAt,
      });
    }

    // Late start detection: startedAt > scheduledAt
    if (trip.scheduledAt && trip.startedAt.getTime() > trip.scheduledAt.getTime()) {
      startedLate = true;
      lateByMinutes = Math.round((trip.startedAt.getTime() - trip.scheduledAt.getTime()) / (1000 * 60));
      timeline.push({
        eventType: TRIP_HISTORY_LATE.EVENT_TYPE,
        eventName: TRIP_HISTORY_LATE.EVENT_NAME,
        description: TRIP_HISTORY_LATE.DESCRIPTION_FORMAT.replace("{minutes}", String(lateByMinutes)),
        timestamp: trip.startedAt,
        metadata: { startedLate: true, lateByMinutes },
      });
    }
  }

  // Trip on progress - after end-verify but before payment
  if (trip.status === "TRIP_PROGRESS" || trip.status === "IN_PROGRESS") {
    timeline.push({
      eventType: "trip_on_progress",
      eventName: "Trip On Progress",
      description: "Trip is in progress",
      timestamp: trip.updatedAt || new Date(),
    });
  }

  // Trip end initiated - when end-verify is called (trip has endOdometer but not ended)
  if (trip.endOdometer && trip.status !== "TRIP_ENDED") {
    timeline.push({
      eventType: "trip_end_initiated",
      eventName: "Trip End Initiated",
      description: "Trip end process initiated",
      timestamp: trip.updatedAt || new Date(),
    });
  }

  // Payment initiated - when payment is collected
  if (trip.paymentStatus === "COMPLETED" && trip.paymentMode) {
    const existingEvent = timeline.find(e => e.eventType === "payment_initiated");
    if (!existingEvent) {
      timeline.push({
        eventType: "payment_initiated",
        eventName: "Payment Initiated",
        description: `Payment collected via ${trip.paymentMode}`,
        timestamp: trip.updatedAt || new Date(),
      });
    }
  }

  // Payment end - when payment is verified and trip ends
  if (trip.status === "TRIP_ENDED" && trip.paymentStatus === "COMPLETED") {
    const existingEvent = timeline.find(e => e.eventType === "payment_end");
    if (!existingEvent) {
      timeline.push({
        eventType: "payment_end",
        eventName: "Payment Completed",
        description: "Payment verified and trip completed",
        timestamp: trip.endedAt || trip.updatedAt || new Date(),
      });
    }
  }

  // Trip ended
  if (trip.endedAt) {
    const existingEvent = timeline.find(e => e.eventType === "trip_ended" && e.timestamp.getTime() === trip.endedAt!.getTime());
    if (!existingEvent) {
      timeline.push({
        eventType: "trip_ended",
        eventName: "Trip Ended",
        description: "Trip ended successfully",
        timestamp: trip.endedAt,
      });
    }
  }

  // Sort timeline by timestamp
  timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Add trip summary
  return {
    tripId: trip.id,
    tripStatus: trip.status,
    paymentStatus: trip.paymentStatus,
    paymentMode: trip.paymentMode,
    totalAmount: trip.totalAmount,
    finalAmount: trip.finalAmount,
    customerName: trip.customerName,
    pickupAddress: trip.pickupAddress || trip.pickupLocation,
    dropAddress: trip.dropAddress || trip.dropLocation,
    scheduledAt: trip.scheduledAt,
    startedAt: trip.startedAt,
    endedAt: trip.endedAt,
    startedLate,
    lateByMinutes,
    timeline,
  };
}

export async function generateEndOtpForTrip(tripId: string, driverId: string) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  if (trip.driverId !== driverId) {
    const err: any = new Error("This trip is not assigned to this driver");
    err.statusCode = 403;
    throw err;
  }

  if (trip.status !== TripStatus.TRIP_PROGRESS && trip.status !== TripStatus.TRIP_STARTED && trip.status !== TripStatus.IN_PROGRESS) {
    const err: any = new Error("Trip is not in progress state");
    err.statusCode = 400;
    throw err;
  }

  const otp = generateOtp(4);

  const updated = await updateTrip(tripId, {
    endOtp: otp,
  });

  // later: send SMS/WhatsApp
  return { tripId: updated.id, otp };
}

interface EndTripInput {
  driverId: string;
  otp: string;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  paymentReference?: string | null;
  overrideReason?: string | null;
  odometerValue: number;
}

export async function endTripWithOtp(tripId: string, input: EndTripInput) {
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  if (trip.driverId !== input.driverId) {
    const err: any = new Error("This trip is not assigned to this driver");
    err.statusCode = 403;
    throw err;
  }

  if (trip.status !== TripStatus.TRIP_PROGRESS && trip.status !== TripStatus.TRIP_STARTED && trip.status !== TripStatus.IN_PROGRESS) {
    const err: any = new Error("Trip is not in progress state");
    err.statusCode = 400;
    throw err;
  }

  if (!trip.endOtp || trip.endOtp !== input.otp) {
    const err: any = new Error("Invalid end OTP");
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();

  const isOverridden = input.finalAmount !== trip.totalAmount;

  const updatedTrip = await updateTrip(tripId, {
    endedAt: now,
    status: TripStatus.TRIP_ENDED,
    finalAmount: input.finalAmount,
    isAmountOverridden: isOverridden,
    overrideReason: isOverridden
      ? input.overrideReason ?? "Manual override"
      : null,
    paymentStatus: input.paymentStatus,
    paymentMode: input.paymentMode,
    paymentReference: input.paymentReference ?? null,
    endOdometer: input.odometerValue,
  });
  
  // Update driver trip status to AVAILABLE when trip ends
  if (trip.driverId) {
    await updateDriverTripStatus(trip.driverId, "AVAILABLE");
  }

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.TRIP_ENDED,
    entityType: ActivityEntityType.TRIP,
    entityId: tripId,
    franchiseId: trip.franchiseId,
    driverId: input.driverId,
    tripId: tripId,
    description: `Trip ${tripId} ended - Final amount: ₹${input.finalAmount}`,
    metadata: {
      tripId: tripId,
      driverId: input.driverId,
      finalAmount: input.finalAmount,
      paymentStatus: input.paymentStatus,
      paymentMode: input.paymentMode,
      odometerValue: input.odometerValue,
      customerName: trip.customerName,
    },
  }).catch((err) => {
    logger.error("Failed to log trip end activity", { error: err });
  });
  
  return updatedTrip;
}

interface CreateTripPhase1Input {
  // Customer data
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  
  // Location data (from Google Places API)
  pickupLocation: string; // Google Place ID or coordinates
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupLocationNote?: string;
  
  destinationLocation: string; // Google Place ID or coordinates
  destinationAddress: string;
  destinationLat?: number;
  destinationLng?: number;
  destinationNote?: string;
  
  // Trip details
  franchiseId: string;
  tripType: string; // Use string instead of TripType enum
  distance?: number;
  distanceScope?: string;
  duration?: number;
  
  // Car preferences
  carGearType?: CarGearType; // MANUAL | AUTOMATIC
  /** Alias used by some clients (same values as carGearType) */
  transmissionType?: CarGearType;
  carType: CarTypeCategory; // PREMIUM | LUXURY | NORMAL
  
  // Schedule
  tripDate: string; // ISO date string
  tripTime: string; // Time string (HH:mm format)
  
  // Flags
  isDetailsReconfirmed: boolean;
  isFareDiscussed: boolean;
  isPriceAccepted: boolean;
  
  // Optional
  createdBy?: string;
}

export async function createTripPhase1(input: CreateTripPhase1Input) {
  // Backward/forward compatibility:
  // - Some clients send `transmissionType` instead of `carGearType`
  const resolvedCarGearType =
    input.carGearType ?? (input as unknown as { transmissionType?: string }).transmissionType;

  // Validate required fields
  if (!input.customerName) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.MISSING_CUSTOMER_NAME);
    err.statusCode = 400;
    throw err;
  }

  if (!input.customerPhone) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.MISSING_CUSTOMER_PHONE);
    err.statusCode = 400;
    throw err;
  }

  // Validate pickup location (trim whitespace and check)
  if (!input.pickupLocation?.trim() || !input.pickupAddress?.trim()) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.MISSING_PICKUP_LOCATION);
    err.statusCode = 400;
    throw err;
  }

  // Validate destination location (trim whitespace and check)
  if (!input.destinationLocation?.trim() || !input.destinationAddress?.trim()) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.MISSING_DESTINATION_LOCATION);
    err.statusCode = 400;
    throw err;
  }

  // Validate car gear type
  if (!resolvedCarGearType || !Object.values(CAR_GEAR_TYPES).includes(resolvedCarGearType as any)) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.INVALID_CAR_GEAR_TYPE);
    err.statusCode = 400;
    throw err;
  }

  // Validate car type category
  if (!Object.values(CAR_TYPE_CATEGORIES).includes(input.carType as any)) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.INVALID_CAR_TYPE);
    err.statusCode = 400;
    throw err;
  }

  // Query TripTypeConfig from database by name (case-insensitive)
  const normalizedInputTripType = input.tripType.trim().toUpperCase().replace(/\s+/g, " ");
  
  // Find matching trip type config by name (case-insensitive)
  const tripTypeConfig = await prisma.tripTypeConfig.findFirst({
    where: {
      name: {
        equals: normalizedInputTripType,
        mode: 'insensitive'
      }
    }
  });

  

  if (!tripTypeConfig) {
    // Fetch all active trip type names for error message
    const activeTripTypes = await prisma.tripTypeConfig.findMany({
      where: { status: 'ACTIVE' },
      select: { name: true },
      orderBy: { name: 'asc' }
    });
    
    const validTripTypeNames = activeTripTypes.map(t => t.name).join(", ");
    
    const err: any = new Error(
      `${TRIP_ERROR_MESSAGES.INVALID_TRIP_TYPE}. Received: "${input.tripType}". Valid values: ${validTripTypeNames || "No active trip types found"}`
    );
    err.statusCode = 400;
    throw err;
  }

  // Use the trip type name from database as the enum value
  const tripTypeEnum = tripTypeConfig.name as string;

  // Find or create customer
  const { customer, isExisting } = await findOrCreateCustomer({
    fullName: input.customerName,
    phone: input.customerPhone,
    email: input.customerEmail,
    franchiseId: input.franchiseId,
  });

  // Persist car preferences:
  // - carGearType: gear/transmission (MANUAL/AUTOMATIC)
  // - carType: category only (PREMIUM/LUXURY/NORMAL)
  //
  // NOTE: Older rows stored JSON in `carType`. Read paths still support that for backward compatibility.
  const carTypeCategory = input.carType;

  // Parse trip date and time
  let scheduledAt: Date | null = null;
  if (input.tripDate && input.tripTime) {
    try {
      // Parse time - handle both 12-hour (AM/PM) and 24-hour formats
      let hours: number, minutes: number;
      const timeStr = input.tripTime.trim().toUpperCase();
      
      if (timeStr.includes("AM") || timeStr.includes("PM")) {
        // 12-hour format: "12:04 PM" or "12:04PM"
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
        if (!timeMatch) {
          throw new Error("Invalid time format");
        }
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        const period = timeMatch[3];
        
        if (period === "PM" && hours !== 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
          hours = 0;
        }
      } else {
        // 24-hour format: "12:04"
        const [h, m] = input.tripTime.split(":").map(Number);
        hours = h;
        minutes = m;
      }
      
      // Parse date - handle DD/MM/YYYY format
      let tripDateTime: Date;
      if (input.tripDate.includes("/")) {
        // DD/MM/YYYY format
        const [day, month, year] = input.tripDate.split("/").map(Number);
        tripDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
      } else {
        // ISO format or other formats
        tripDateTime = new Date(input.tripDate);
        tripDateTime.setHours(hours, minutes, 0, 0);
      }
      
      scheduledAt = tripDateTime;
    } catch (error: any) {
      const err: any = new Error(`Invalid trip date or time format: ${error.message}`);
      err.statusCode = 400;
      throw err;
    }
  }

  // Calculate pricing (optional - if distance/duration provided)
  let calculatedPrice = null;
  let baseAmount = tripTypeConfig.basePrice;
  let extraAmount = 0;
  let totalAmount = baseAmount;
  let finalAmount = baseAmount;

 

  // Create trip in phase 1 (PENDING status, no driver assigned yet)
  const trip = await repoCreateTripPhase1({
    franchiseId: input.franchiseId,
    customerId: customer.id,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    tripType: tripTypeEnum,
    pickupLocation: input.pickupLocation,
    pickupAddress: input.pickupAddress,
    pickupLat: input.pickupLat ?? null,
    pickupLng: input.pickupLng ?? null,
    pickupLocationNote: input.pickupLocationNote,
    dropLocation: input.destinationLocation,
    dropAddress: input.destinationAddress,
    dropLat: input.destinationLat ?? null,
    dropLng: input.destinationLng ?? null,
    destinationLat: input.destinationLat ?? null,
    destinationLng: input.destinationLng ?? null,
    dropLocationNote: input.destinationNote,
    carType: carTypeCategory,
    carGearType: resolvedCarGearType,
    scheduledAt,
    isDetailsReconfirmed: input.isDetailsReconfirmed,
    isFareDiscussed: input.isFareDiscussed,
    isPriceAccepted: input.isPriceAccepted,
    createdBy: input.createdBy,
    baseAmount,
    extraAmount,
    totalAmount,
    finalAmount,
  });

  // Start real-time dispatch (non-blocking)
  tripDispatchService.startDispatchForTrip(trip.id).catch(() => {});

  return {
    trip: augmentTripCarPreferences(trip),
    customer: {
      id: customer.id,
      name: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      isExisting,
    },
    pricing: calculatedPrice
      ? {
          calculated: true,
          breakdown: calculatedPrice.breakdown,
          configUsed: calculatedPrice.configUsed,
        }
      : {
          calculated: false,
          message: "Pricing not calculated. Distance or duration required.",
        },
  };
}

/**
 * Update trip live location from driver
 */
interface UpdateTripLiveLocationInput {
  tripId: string;
  lat: number;
  long: number;
}

export async function updateTripLiveLocation(input: UpdateTripLiveLocationInput) {
  const { tripId, lat, long } = input;

  // Validate trip exists
  const trip = await repoGetTripById(tripId);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }

  // Update trip with live location
  const updatedTrip = await updateTrip(tripId, {
    liveLocationLat: lat,
    liveLocationLng: long,
  });

  return {
    tripId: updatedTrip.id,
    liveLocationLat: updatedTrip.liveLocationLat,
    liveLocationLng: updatedTrip.liveLocationLng,
    message: "Live location updated successfully",
  };
}
