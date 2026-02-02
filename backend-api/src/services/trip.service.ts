import {
  getAllTrips,
  getTripById as repoGetTripById,
  createTrip as repoCreateTrip,
  createTripPhase1 as repoCreateTripPhase1,
  updateTrip,
  getUnassignedTrips,
  getTripsPaginated,
  getUnassignedTripsPaginated,
  getTripsByDriver,
  getTripsByDriverAllStatuses,
  getAssignedTrips as repoGetAssignedTrips,
  getAssignedTripsPaginated as repoGetAssignedTripsPaginated,
  type TripFilters,
} from "../repositories/trip.repository";
import { getActivityLogsByTripId } from "../repositories/activity.repository";
import { TripStatus, PaymentStatus, PaymentMode, TripType } from "@prisma/client";

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
import { ActivityAction, ActivityEntityType } from "@prisma/client";
import logger from "../config/logger";
import { sendTripStartOtpEmail, sendTripEndOtpEmail, sendTripEndConfirmationEmail } from "./email.service";
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
  dropLocation?: string | null;
  scheduledAt?: string | null;
  baseAmount: number;
  extraAmount?: number;
}

export async function listTrips() {
  const trips = await getAllTrips();
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

  // Return drivers with match information
  return availableDrivers.map(({ driver, matchScore }) => ({
    id: driver.id,
    firstName: driver.firstName,
    lastName: driver.lastName,
    phone: driver.phone,
    driverCode: driver.driverCode,
    status: driver.status,
    currentRating: driver.currentRating,
    performance: driver.performance,
    matchScore,
  }));
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

  // Log activity (non-blocking)
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
    dropLocation: input.dropLocation ?? null,
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
    },
  }).catch((err) => logger.error("Failed to log cancel activity", { error: err }));

  return updatedTrip;
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
}

export async function initiateStartTrip(input: InitiateStartTripInput) {
  const { tripId, odometerValue, odometerPic, carFrontPic, carBackPic } = input;
  
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

  // Store OTP and temporary data in trip (before status change)
  // Note: odometerPic is stored in alternativePhone field temporarily
  // TODO: Add odometerPic field to Trip schema in future migration
  await updateTrip(tripId, {
    startOtp: otp,
    startOdometer: odometerValue,
    carImageFront: carFrontPic,
    carImageBack: carBackPic,
    alternativePhone: odometerPic, // Temporary storage - TODO: Add proper field
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
}

export async function initiateEndTrip(input: InitiateEndTripInput) {
  const { tripId, odometerValue, odometerImage } = input;
  
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

  // Store OTP and temporary end odometer data (before status change)
  // Note: odometerImage is stored in alternativePhone field temporarily
  // TODO: Add odometerImage field to Trip schema in future migration
  await updateTrip(tripId, {
    endOtp: otp,
    endOdometer: odometerValue,
    alternativePhone: odometerImage, // Temporary storage - TODO: Add proper field
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

  // Calculate distance traveled (in km)
  const distanceTraveled = trip.endOdometer - trip.startOdometer;
  if (distanceTraveled < 0) {
    const err: any = new Error("End odometer reading cannot be less than start odometer reading");
    err.statusCode = 400;
    throw err;
  }

  // Calculate time taken (in hours)
  const now = new Date();
  const timeTakenMs = now.getTime() - trip.startedAt.getTime();
  const timeTakenHours = timeTakenMs / (1000 * 60 * 60); // Convert milliseconds to hours

  // Get trip type
  const tripType = trip.tripType as TripType;

  // Get car type from driver if available
  let carType: "PREMIUM" | "LUXURY" | "NORMAL" | undefined;
  if (trip.Driver?.carType) {
    // Map driver car type to pricing car type category
    const driverCarType = trip.Driver.carType.toUpperCase();
    if (driverCarType === "PREMIUM" || driverCarType === "LUXURY") {
      carType = driverCarType as "PREMIUM" | "LUXURY";
    } else {
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

  // Update trip with calculated amount but don't end it yet - wait for payment
  await updateTrip(tripId, {
    finalAmount: calculatedAmount,
    totalAmount: calculatedAmount, // Update total amount with calculated value
    endOtp: null, // Clear OTP after successful verification
    status: TripStatus.TRIP_PROGRESS, // Keep trip in progress until payment is verified
  });

  // Return only calculated values and total amount
  return {
    totalAmount: calculatedAmount,
    distanceTraveled: Math.round(distanceTraveled * 100) / 100, // Round to 2 decimal places
    timeTakenHours: Math.round(timeTakenHours * 100) / 100, // Round to 2 decimal places
    timeTakenMinutes: Math.round((timeTakenHours * 60) * 100) / 100,
    tripType,
    calculatedAmount,
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

  return {
    tripId: updatedTrip.id,
    status: "TRIP_ENDED",
    message: "Trip ended successfully. Confirmation email sent to customer.",
    emailSent: !!trip.customerEmail,
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
  tripType: TripType;
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

  // Map trip type name to enum value (e.g., "City Drop" -> "CITY_DROPOFF")
  // Normalize: remove extra spaces, convert to lowercase, handle various formats
  const normalizeTripType = (tripType: string): string => {
    return tripType
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/[_-]/g, " "); // Replace underscores and hyphens with spaces
  };

  const tripTypeMap: Record<string, TripType> = {
    "city drop": TripType.CITY_DROPOFF,
    "city dropoff": TripType.CITY_DROPOFF,
    "city round": TripType.CITY_ROUND,
    "city round trip": TripType.CITY_ROUND,
    "long drop": TripType.LONG_DROPOFF,
    "long dropoff": TripType.LONG_DROPOFF,
    "long round": TripType.LONG_ROUND,
    "long round trip": TripType.LONG_ROUND,
    "city_dropoff": TripType.CITY_DROPOFF,
    "city_round": TripType.CITY_ROUND,
    "long_dropoff": TripType.LONG_DROPOFF,
    "long_round": TripType.LONG_ROUND,
  };
  
  let tripTypeEnum: TripType;
  const normalizedTripType = normalizeTripType(input.tripType);
  
  // Check if it's already an enum value (case-insensitive)
  const upperCaseTripType = input.tripType.trim().toUpperCase();
  if (Object.values(TripType).includes(upperCaseTripType as TripType)) {
    tripTypeEnum = upperCaseTripType as TripType;
  } else if (tripTypeMap[normalizedTripType]) {
    // Map from display name to enum
    tripTypeEnum = tripTypeMap[normalizedTripType];
  } else {
    // Try to match by keywords (more flexible matching)
    if (normalizedTripType.includes("city") && normalizedTripType.includes("drop")) {
      tripTypeEnum = TripType.CITY_DROPOFF;
    } else if (normalizedTripType.includes("city") && normalizedTripType.includes("round")) {
      tripTypeEnum = TripType.CITY_ROUND;
    } else if (normalizedTripType.includes("long") && normalizedTripType.includes("drop")) {
      tripTypeEnum = TripType.LONG_DROPOFF;
    } else if (normalizedTripType.includes("long") && normalizedTripType.includes("round")) {
      tripTypeEnum = TripType.LONG_ROUND;
    } else {
      const err: any = new Error(
        `${TRIP_ERROR_MESSAGES.INVALID_TRIP_TYPE}. Received: "${input.tripType}". Valid values: ${Object.values(TripType).join(", ")}`
      );
      err.statusCode = 400;
      throw err;
    }
  }

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
  let baseAmount = 0;
  let extraAmount = 0;
  let totalAmount = 0;
  let finalAmount = 0;

  if (input.distance !== undefined || input.duration !== undefined) {
    try {
      calculatedPrice = await calculateTripPrice({
        tripType: tripTypeEnum,
        distance: input.distance,
        duration: input.duration,
        carType: input.carType,
      });

      baseAmount = calculatedPrice.basePrice;
      extraAmount = calculatedPrice.extraCharges;
      totalAmount = calculatedPrice.totalPrice;
      finalAmount = calculatedPrice.totalPrice;
    } catch (error: any) {
      // If pricing calculation fails, log but don't fail trip creation
      // Pricing can be calculated later or manually set
      console.warn("Pricing calculation failed:", error.message);
    }
  }

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
