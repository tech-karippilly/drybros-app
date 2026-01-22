import {
  getAllTrips,
  getTripById as repoGetTripById,
  createTrip as repoCreateTrip,
  createTripPhase1 as repoCreateTripPhase1,
  updateTrip,
  getUnassignedTrips,
  getTripsPaginated,
  getUnassignedTripsPaginated,
} from "../repositories/trip.repository";
import { TripStatus, PaymentStatus, PaymentMode, TripType } from "@prisma/client";

import { getCustomerById } from "../repositories/customer.repository";
import { getDriverById, updateDriverTripStatus } from "../repositories/driver.repository";
import { generateOtp } from "../utils/otp";
import { findOrCreateCustomer } from "./customer.service";
import {
  CAR_GEAR_TYPES,
  CAR_TYPE_CATEGORIES,
  TRIP_ERROR_MESSAGES,
} from "../constants/trip";
import { calculateTripPrice } from "./pricing.service";
import {
  getDriversWithPerformance,
  sortDriversByPerformance,
  DriverWithPerformance,
} from "./driver-performance.service";
import prisma from "../config/prismaClient";

interface CreateTripInput {
  franchiseId: number;
  driverId: number;
  customerId: number;
  tripType: string;
  pickupLocation: string;
  dropLocation?: string | null;
  scheduledAt?: string | null;
  baseAmount: number;
  extraAmount?: number;
}

export async function listTrips() {
  return getAllTrips();
}

export interface PaginationQuery {
  page: number;
  limit: number;
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
  return getUnassignedTrips();
}

/**
 * Get all trips with pagination
 */
export async function listTripsPaginated(
  pagination: PaginationQuery
): Promise<PaginatedTripsResponse> {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const { data, total } = await getTripsPaginated(skip, limit);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data,
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
    data,
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
  return trip;
}

/**
 * Get available drivers for trip assignment, prioritized by performance
 */
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

  // Filter eligible drivers and calculate match score
  const availableDrivers = await Promise.all(
    allDrivers.map(async (driver) => {
      // Mandatory eligibility checks
      if (driver.franchiseId !== trip.franchiseId) return null;
      if (driver.status !== "ACTIVE" || !driver.isActive) return null;
      if (driver.bannedGlobally) return null;
      if (driver.licenseExpDate < new Date()) return null;

      // Check if driver has active trip
      const activeTrips = await prisma.trip.count({
        where: {
          driverId: driver.id,
          status: {
            in: [
              "ASSIGNED",
              "DRIVER_ACCEPTED",
              "IN_PROGRESS",
              "TRIP_STARTED",
              "TRIP_PROGRESS",
            ],
          },
        },
      });
      if (activeTrips > 0) return null;

      // Calculate additional match score (car type, etc.)
      let matchScore = 0;

      // Car type matching (if trip has car type requirement)
      if (trip.carType) {
        try {
          const tripCarType = JSON.parse(trip.carType);
          const driverCarTypes = JSON.parse(driver.carTypes || "[]");

          // Check gear type match
          if (driverCarTypes.includes(tripCarType.gearType)) {
            matchScore += 25;
          }

          // Check category match
          const categoryMap: Record<string, string[]> = {
            PREMIUM: ["PREMIUM_CARS", "LUXURY_CARS"],
            LUXURY: ["LUXURY_CARS", "PREMIUM_CARS"],
            NORMAL: ["MANUAL", "AUTOMATIC"],
          };

          if (
            categoryMap[tripCarType.category]?.some((cat) =>
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
    })
  );

  // Filter out nulls (ineligible drivers)
  const eligible = availableDrivers.filter(
    (d) => d !== null
  ) as Array<{
    driver: DriverWithPerformance;
    matchScore: number;
  }>;

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

  eligible.sort((a, b) => {
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
  return eligible.map(({ driver, matchScore }) => ({
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
  if (trip.driverId) {
    const err: any = new Error("Trip already has a driver assigned");
    err.statusCode = 400;
    throw err;
  }
  if (
    trip.status !== "NOT_ASSIGNED" &&
    trip.status !== "REQUESTED" &&
    trip.status !== "PENDING"
  ) {
    const err: any = new Error(
      `Cannot assign driver to trip with status: ${trip.status}`
    );
    err.statusCode = 400;
    throw err;
  }
  const driver = await getDriverById(driverId);
  if (!driver) {
    const err: any = new Error("Driver not found");
    err.statusCode = 404;
    throw err;
  }
  // Validate all criteria
  if (driver.franchiseId !== trip.franchiseId) {
    const err: any = new Error("Driver belongs to different franchise");
    err.statusCode = 400;
    throw err;
  }
  if (driver.status !== "ACTIVE" || !driver.isActive) {
    const err: any = new Error("Driver is not active");
    err.statusCode = 400;
    throw err;
  }
  if (driver.bannedGlobally) {
    const err: any = new Error("Driver is globally banned");
    err.statusCode = 400;
    throw err;
  }
  if (driver.licenseExpDate < new Date()) {
    const err: any = new Error("Driver license has expired");
    err.statusCode = 400;
    throw err;
  }
  // Check if driver has active trip
  const activeTrips = await prisma.trip.count({
    where: {
      driverId: driver.id,
      status: {
        in: [
          "ASSIGNED",
          "DRIVER_ACCEPTED",
          "IN_PROGRESS",
          "TRIP_STARTED",
          "TRIP_PROGRESS",
        ],
      },
    },
  });
  if (activeTrips > 0) {
    const err: any = new Error("Driver already has an active trip");
    err.statusCode = 400;
    throw err;
  }
  // Assign driver
  const updatedTrip = await updateTrip(tripId, {
    driverId,
    status: "ASSIGNED",
  });
  
  // Update driver trip status to ON_TRIP
  await updateDriverTripStatus(driverId, "ON_TRIP");
  
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

  return updateTrip(tripId, { status: "DRIVER_ACCEPTED" });
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

export async function startTripWithOtp(
  tripId: string,
  driverId: string,
  otp: string
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

  // Allow both ASSIGNED and DRIVER_ACCEPTED (legacy) statuses
  if (trip.status !== TripStatus.ASSIGNED && trip.status !== TripStatus.DRIVER_ACCEPTED) {
    const err: any = new Error("Trip is not in ASSIGNED state");
    err.statusCode = 400;
    throw err;
  }

  if (!trip.startOtp || trip.startOtp !== otp) {
    const err: any = new Error("Invalid start OTP");
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();

  const updatedTrip = await updateTrip(tripId, {
    startedAt: now,
    status: TripStatus.TRIP_STARTED,
  });
  
  // Ensure driver trip status is ON_TRIP
  await updateDriverTripStatus(driverId, "ON_TRIP");
  
  return updatedTrip;
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
  });
  
  // Update driver trip status to AVAILABLE when trip ends
  if (trip.driverId) {
    await updateDriverTripStatus(trip.driverId, "AVAILABLE");
  }
  
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
  pickupLocationNote?: string;
  
  destinationLocation: string; // Google Place ID or coordinates
  destinationAddress: string;
  destinationNote?: string;
  
  // Trip details
  franchiseId: string;
  tripType: TripType;
  distance?: number;
  distanceScope?: string;
  
  // Car preferences
  carGearType: string; // MANUAL | AUTOMATIC
  carType: string; // PREMIUM | LUXURY | NORMAL
  
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
  if (!Object.values(CAR_GEAR_TYPES).includes(input.carGearType as any)) {
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

  // Combine car gear type and category for storage
  // Store as JSON: {"gearType": "MANUAL", "category": "PREMIUM"}
  const carTypeData = JSON.stringify({
    gearType: input.carGearType,
    category: input.carType,
  });

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
    pickupLocationNote: input.pickupLocationNote,
    dropLocation: input.destinationLocation,
    dropAddress: input.destinationAddress,
    dropLocationNote: input.destinationNote,
    carType: carTypeData,
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

  return {
    trip,
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
