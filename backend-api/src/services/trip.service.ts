import {
  getAllTrips,
  getTripById as repoGetTripById,
  createTrip as repoCreateTrip,
  createTripPhase1 as repoCreateTripPhase1,
  updateTrip,
} from "../repositories/trip.repository";
import { TripStatus, PaymentStatus, PaymentMode, TripType } from "@prisma/client";

import { getCustomerById } from "../repositories/customer.repository";
import { getDriverById } from "../repositories/driver.repository";
import { generateOtp } from "../utils/otp";
import { findOrCreateCustomer } from "./customer.service";
import {
  CAR_GEAR_TYPES,
  CAR_TYPE_CATEGORIES,
  TRIP_ERROR_MESSAGES,
} from "../constants/trip";
import { calculateTripPrice } from "./pricing.service";

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

export async function getTrip(id: number) {
  const trip = await repoGetTripById(id);
  if (!trip) {
    const err: any = new Error("Trip not found");
    err.statusCode = 404;
    throw err;
  }
  return trip;
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

export async function driverAcceptTrip(tripId: number, driverId: number) {
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

export async function driverRejectTrip(tripId: number, driverId: number) {
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

  return updateTrip(tripId, {
    status: "REJECTED_BY_DRIVER",
    driverId: null,
  });
}

export async function generateStartOtpForTrip(
  tripId: number,
  driverId: number
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
  tripId: number,
  driverId: number,
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

  if (trip.status !== TripStatus.DRIVER_ACCEPTED) {
    const err: any = new Error("Trip is not in DRIVER_ACCEPTED state");
    err.statusCode = 400;
    throw err;
  }

  if (!trip.startOtp || trip.startOtp !== otp) {
    const err: any = new Error("Invalid start OTP");
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();

  return updateTrip(tripId, {
    startedAt: now,
    status: "IN_PROGRESS",
  });
}

export async function generateEndOtpForTrip(tripId: number, driverId: number) {
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

  if (trip.status !== TripStatus.IN_PROGRESS) {
    const err: any = new Error("Trip is not in IN_PROGRESS state");
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
  driverId: number;
  otp: string;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  paymentReference?: string | null;
  overrideReason?: string | null;
}

export async function endTripWithOtp(tripId: number, input: EndTripInput) {
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

  if (trip.status !== TripStatus.IN_PROGRESS) {
    const err: any = new Error("Trip is not in IN_PROGRESS state");
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

  return updateTrip(tripId, {
    endedAt: now,
    status: TripStatus.COMPLETED,
    finalAmount: input.finalAmount,
    isAmountOverridden: isOverridden,
    overrideReason: isOverridden
      ? input.overrideReason ?? "Manual override"
      : null,
    paymentStatus: input.paymentStatus,
    paymentMode: input.paymentMode,
    paymentReference: input.paymentReference ?? null,
  });
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

  if (!input.pickupLocation || !input.pickupAddress) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.MISSING_PICKUP_LOCATION);
    err.statusCode = 400;
    throw err;
  }

  if (!input.destinationLocation || !input.destinationAddress) {
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

  // Validate trip type
  if (!Object.values(TripType).includes(input.tripType)) {
    const err: any = new Error(TRIP_ERROR_MESSAGES.INVALID_TRIP_TYPE);
    err.statusCode = 400;
    throw err;
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
      const [hours, minutes] = input.tripTime.split(":").map(Number);
      const tripDateTime = new Date(input.tripDate);
      tripDateTime.setHours(hours, minutes, 0, 0);
      scheduledAt = tripDateTime;
    } catch (error) {
      const err: any = new Error("Invalid trip date or time format");
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
        tripType: input.tripType,
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

  // Create trip in phase 1 (REQUESTED status, no driver assigned yet)
  const trip = await repoCreateTripPhase1({
    franchiseId: input.franchiseId,
    customerId: customer.id,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    tripType: input.tripType,
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
