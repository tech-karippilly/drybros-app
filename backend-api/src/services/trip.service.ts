import {
  getAllTrips,
  getTripById as repoGetTripById,
  createTrip as repoCreateTrip,
  updateTrip,
} from "../repositories/trip.repository";
import { TripStatus, PaymentStatus, PaymentMode } from "@prisma/client";

import { getCustomerById } from "../repositories/customer.repository";
import { getDriverById } from "../repositories/driver.repository";
import { generateOtp } from "../utils/otp";

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
