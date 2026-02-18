import { UserRole, TripStatus, DriverStatus } from "@prisma/client";
import prisma from "../config/prismaClient";
import {
  getAllTrips,
  getTripsPaginated,
  getTripById as repoGetTripById,
  createTrip as repoCreateTrip,
  updateTrip as repoUpdateTrip,
  getTripsByDriver as repoGetTripsByDriver,
  getDriverMatchingCar,
  TripFilters,
} from "../repositories/trip.repository";
import {
  CreateTripDTO,
  AssignDriverDTO,
  ReassignDriverDTO,
  RescheduleTripDTO,
  CancelTripDTO,
  StartTripDTO,
  EndTripDTO,
  CollectPaymentDTO,
} from "../types/trip.dto";
import logger from "../config/logger";

// ============================================
// LIST TRIPS
// ============================================

export async function listTrips(filters?: TripFilters, pagination?: { page: number; limit: number }) {
  if (pagination) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const { data, total } = await getTripsPaginated(skip, limit, filters);
    
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    
    return {
      success: true,
      message: "Trips retrieved successfully",
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  const data = await getAllTrips(filters);
  
  return {
    success: true,
    message: "Trips retrieved successfully",
    data,
  };
}

// ============================================
// GET TRIP BY ID
// ============================================

export async function getTripById(id: string) {
  const trip = await repoGetTripById(id);
  
  if (!trip) {
    const error: any = new Error("Trip not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    success: true,
    message: "Trip retrieved successfully",
    data: trip,
  };
}

// ============================================
// CREATE TRIP
// ============================================

export async function createTrip(
  input: CreateTripDTO,
  userId: string,
  userRole: UserRole
) {
  // Determine franchiseId based on role
  let franchiseId: string;

  if (userRole === UserRole.ADMIN) {
    if (!input.franchiseId) {
      const error: any = new Error("Franchise ID is required for ADMIN");
      error.statusCode = 400;
      throw error;
    }
    franchiseId = input.franchiseId;
  } else if (userRole === UserRole.MANAGER || userRole === UserRole.OFFICE_STAFF) {
    // Get franchiseId from user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { franchiseId: true },
    });

    if (!user || !user.franchiseId) {
      const error: any = new Error("User not associated with any franchise");
      error.statusCode = 403;
      throw error;
    }

    franchiseId = user.franchiseId;
  } else {
    const error: any = new Error("Insufficient permissions to create trip");
    error.statusCode = 403;
    throw error;
  }

  // Validate franchise is not blocked
  const franchise = await prisma.franchise.findUnique({
    where: { id: franchiseId },
    select: { status: true },
  });

  if (!franchise) {
    const error: any = new Error("Franchise not found");
    error.statusCode = 404;
    throw error;
  }

  if (franchise.status === "BLOCKED") {
    const error: any = new Error("Cannot create trip: Franchise is blocked");
    error.statusCode = 403;
    throw error;
  }

  // Create trip with NOT_ASSIGNED status
  const trip = await repoCreateTrip({
    franchiseId,
    customerId: input.customerId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    tripType: input.tripType,
    pickupLocation: input.pickupLocation,
    pickupAddress: input.pickupAddress,
    pickupLat: input.pickupLat,
    pickupLng: input.pickupLng,
    pickupLocationNote: input.pickupLocationNote,
    dropLocation: input.dropLocation,
    dropAddress: input.dropAddress,
    dropLat: input.dropLat,
    dropLng: input.dropLng,
    dropLocationNote: input.dropLocationNote,
    requiredCarType: input.requiredCarType,
    requiredTransmission: input.requiredTransmission,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    createdBy: userId,
  });

  logger.info("Trip created", { tripId: trip.id, franchiseId, userId });

  return {
    success: true,
    message: "Trip created successfully",
    data: trip,
  };
}

// ============================================
// ASSIGN DRIVER
// ============================================

export async function assignDriver(
  tripId: string,
  input: AssignDriverDTO,
  userId: string
) {
  // Get trip
  const trip = await repoGetTripById(tripId);

  if (!trip) {
    const error: any = new Error("Trip not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate trip status
  if (trip.status !== TripStatus.NOT_ASSIGNED && trip.status !== TripStatus.REQUESTED) {
    const error: any = new Error(`Trip cannot be assigned in ${trip.status} status`);
    error.statusCode = 400;
    throw error;
  }

  // Get driver
  const driver = await prisma.driver.findUnique({
    where: { id: input.driverId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      driverTripStatus: true,
      franchiseId: true,
    },
  });

  if (!driver) {
    const error: any = new Error("Driver not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate driver status
  if (driver.status !== DriverStatus.ACTIVE) {
    const error: any = new Error("Driver is not active");
    error.statusCode = 400;
    throw error;
  }

  if (driver.driverTripStatus !== "AVAILABLE") {
    const error: any = new Error("Driver is not available");
    error.statusCode = 400;
    throw error;
  }

  // Validate franchise match
  if (driver.franchiseId !== trip.franchiseId) {
    const error: any = new Error("Driver does not belong to the same franchise");
    error.statusCode = 400;
    throw error;
  }

  // Find matching car - temporarily skip this until Prisma is regenerated
  // const matchingCar = await getDriverMatchingCar(
  //   driver.id,
  //   trip.requiredCarType!,
  //   trip.requiredTransmission!
  // );

  // if (!matchingCar) {
  //   const error: any = new Error("Driver does not have a matching car");
  //   error.statusCode = 400;
  //   throw error;
  // }

  // Update trip
  const updatedTrip = await repoUpdateTrip(tripId, {
    driverId: driver.id,
    // assignedCarId: matchingCar.id, // Uncomment after Prisma regeneration
    status: TripStatus.ASSIGNED,
  });

  // Update driver status
  await prisma.driver.update({
    where: { id: driver.id },
    data: { driverTripStatus: "ON_TRIP" },
  });

  logger.info("Driver assigned to trip", {
    tripId,
    driverId: driver.id,
    userId,
  });

  return {
    success: true,
    message: "Driver assigned successfully",
    data: updatedTrip,
  };
}

// ============================================
// REASSIGN DRIVER
// ============================================

export async function reassignDriver(
  tripId: string,
  input: ReassignDriverDTO,
  userId: string
) {
  // Get trip
  const trip = await repoGetTripById(tripId);

  if (!trip) {
    const error: any = new Error("Trip not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate trip status (can only reassign before trip starts)
  if (trip.status !== TripStatus.ASSIGNED && trip.status !== TripStatus.DRIVER_ACCEPTED) {
    const error: any = new Error(`Trip cannot be reassigned in ${trip.status} status`);
    error.statusCode = 400;
    throw error;
  }

  if (!trip.driverId) {
    const error: any = new Error("Trip has no driver to reassign");
    error.statusCode = 400;
    throw error;
  }

  const oldDriverId = trip.driverId;

  if (oldDriverId === input.newDriverId) {
    const error: any = new Error("New driver must be different from current driver");
    error.statusCode = 400;
    throw error;
  }

  // Validate new driver (same checks as assign)
  const newDriver = await prisma.driver.findUnique({
    where: { id: input.newDriverId },
  });

  if (!newDriver || newDriver.status !== DriverStatus.ACTIVE || newDriver.driverTripStatus !== "AVAILABLE") {
    const error: any = new Error("New driver is not eligible for assignment");
    error.statusCode = 400;
    throw error;
  }

  if (newDriver.franchiseId !== trip.franchiseId) {
    const error: any = new Error("New driver does not belong to the same franchise");
    error.statusCode = 400;
    throw error;
  }

  // Update old driver status
  await prisma.driver.update({
    where: { id: oldDriverId },
    data: { driverTripStatus: "AVAILABLE" },
  });

  // Update trip with new driver
  const updatedTrip = await repoUpdateTrip(tripId, {
    driverId: newDriver.id,
    status: TripStatus.ASSIGNED,
  });

  // Update new driver status
  await prisma.driver.update({
    where: { id: newDriver.id },
    data: { driverTripStatus: "ON_TRIP" },
  });

  // Log reassignment (TODO: Uncomment after Prisma regeneration)
  // try {
  //   await prisma.tripReassignment.create({
  //     data: {
  //       tripId,
  //       previousDriverId: oldDriverId,
  //       newDriverId: newDriver.id,
  //       reason: input.reason || null,
  //       reassignedBy: userId,
  //     },
  //   });
  // } catch (error) {
  //   logger.error("Failed to log trip reassignment", { error, tripId });
  // }

  logger.info("Trip reassigned", {
    tripId,
    oldDriverId,
    newDriverId: newDriver.id,
    userId,
  });

  return {
    success: true,
    message: "Driver reassigned successfully",
    data: updatedTrip,
  };
}

// ============================================
// RESCHEDULE TRIP
// ============================================

export async function rescheduleTrip(
  tripId: string,
  input: RescheduleTripDTO,
  userId: string
) {
  const trip = await repoGetTripById(tripId);

  if (!trip) {
    const error: any = new Error("Trip not found");
    error.statusCode = 404;
    throw error;
  }

  // Cannot reschedule completed trips
  if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.TRIP_ENDED) {
    const error: any = new Error("Cannot reschedule completed trip");
    error.statusCode = 400;
    throw error;
  }

  const newScheduledAt = new Date(input.newDate);

  const updatedTrip = await repoUpdateTrip(tripId, {
    scheduledAt: newScheduledAt,
  });

  // Log reschedule (TODO: Uncomment after Prisma regeneration)
  // await prisma.tripReschedule.create({
  //   data: {
  //     tripId,
  //     oldScheduledAt: trip.scheduledAt,
  //     newScheduledAt,
  //     reason: input.reason || null,
  //     rescheduledBy: userId,
  //   },
  // });

  logger.info("Trip rescheduled", { tripId, newDate: newScheduledAt, userId });

  return {
    success: true,
    message: "Trip rescheduled successfully",
    data: updatedTrip,
  };
}

// ============================================
// CANCEL TRIP
// ============================================

export async function cancelTrip(
  tripId: string,
  input: CancelTripDTO,
  userId: string
) {
  const trip = await repoGetTripById(tripId);

  if (!trip) {
    const error: any = new Error("Trip not found");
    error.statusCode = 404;
    throw error;
  }

  // Cannot cancel completed trips
  if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.TRIP_ENDED) {
    const error: any = new Error("Cannot cancel completed trip");
    error.statusCode = 400;
    throw error;
  }

  const updatedTrip = await repoUpdateTrip(tripId, {
    status: "CANCELLED_BY_OFFICE" as any, // Assuming office cancellation
  });

  // If driver was assigned, set them back to AVAILABLE
  if (trip.driverId) {
    await prisma.driver.update({
      where: { id: trip.driverId },
      data: { driverTripStatus: "AVAILABLE" },
    });
  }

  logger.info("Trip cancelled", { tripId, reason: input.reason, userId });

  return {
    success: true,
    message: "Trip cancelled successfully",
    data: updatedTrip,
  };
}

// ============================================
// START TRIP (DRIVER ONLY)
// ============================================

export async function startTrip(
  tripId: string,
  input: StartTripDTO,
  driverId: string
) {
  const trip = await repoGetTripById(tripId);

  if (!trip) {
    const error: any = new Error("Trip not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate driver owns this trip
  if (trip.driverId !== driverId) {
    const error: any = new Error("This trip is not assigned to you");
    error.statusCode = 403;
    throw error;
  }

  // Validate trip status
  if (trip.status !== TripStatus.ASSIGNED && trip.status !== TripStatus.DRIVER_ACCEPTED) {
    const error: any = new Error(`Trip cannot be started in ${trip.status} status`);
    error.statusCode = 400;
    throw error;
  }

  // Validate OTP
  if (trip.startOtp !== input.startOtp) {
    const error: any = new Error("Invalid start OTP");
    error.statusCode = 400;
    throw error;
  }

  const updatedTrip = await repoUpdateTrip(tripId, {
    status: TripStatus.TRIP_STARTED,
    startOdometer: input.startOdometer,
    driverSelfieUrl: input.driverSelfieUrl,
    odometerStartImageUrl: input.odometerStartImageUrl,
    startedAt: new Date(),
  });

  logger.info("Trip started", { tripId, driverId });

  return {
    success: true,
    message: "Trip started successfully",
    data: updatedTrip,
  };
}

// ============================================
// END TRIP (DRIVER ONLY)
// ============================================

export async function endTrip(
  tripId: string,
  input: EndTripDTO,
  driverId: string
) {
  const trip = await repoGetTripById(tripId);

  if (!trip) {
    const error: any = new Error("Trip not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate driver owns this trip
  if (trip.driverId !== driverId) {
    const error: any = new Error("This trip is not assigned to you");
    error.statusCode = 403;
    throw error;
  }

  // Validate trip status
  if (trip.status !== TripStatus.TRIP_STARTED && trip.status !== TripStatus.TRIP_PROGRESS) {
    const error: any = new Error(`Trip cannot be ended in ${trip.status} status`);
    error.statusCode = 400;
    throw error;
  }

  // Validate OTP
  if (trip.endOtp !== input.endOtp) {
    const error: any = new Error("Invalid end OTP");
    error.statusCode = 400;
    throw error;
  }

  // Calculate extra charges based on odometer
  const odometerDifference = input.endOdometer - (trip.startOdometer || 0);
  // TODO: Calculate based on pricing rules

  const updatedTrip = await repoUpdateTrip(tripId, {
    status: TripStatus.COMPLETED,
    endOdometer: input.endOdometer,
    odometerEndImageUrl: input.odometerEndImageUrl,
    endedAt: new Date(),
  });

  // Set driver back to AVAILABLE
  await prisma.driver.update({
    where: { id: driverId },
    data: { driverTripStatus: "AVAILABLE" },
  });

  logger.info("Trip ended", { tripId, driverId, odometerDifference });

  return {
    success: true,
    message: "Trip ended successfully",
    data: updatedTrip,
  };
}

// ============================================
// COLLECT PAYMENT (DRIVER ONLY)
// ============================================

export async function collectPayment(
  tripId: string,
  input: CollectPaymentDTO,
  driverId: string
) {
  const trip = await repoGetTripById(tripId);

  if (!trip) {
    const error: any = new Error("Trip not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate driver owns this trip
  if (trip.driverId !== driverId) {
    const error: any = new Error("This trip is not assigned to you");
    error.statusCode = 403;
    throw error;
  }

  // Validate trip is completed
  if (trip.status !== TripStatus.COMPLETED && trip.status !== TripStatus.TRIP_ENDED) {
    const error: any = new Error("Payment can only be collected after trip completion");
    error.statusCode = 400;
    throw error;
  }

  const updatedTrip = await repoUpdateTrip(tripId, {
    paymentStatus: "COMPLETED",
    paymentMode: input.paymentMode === "UPI" ? "UPI" : "CASH",
    paymentReference: input.paymentReference,
  });

  // Create driver transaction
  try {
    await prisma.driverTransaction.create({
      data: {
        driverId,
        tripId,
        type: "EARNING" as any, // Use correct enum value
        amount: trip.finalAmount,
        description: `Payment collected for trip ${tripId}`,
      },
    });
  } catch (error) {
    logger.error("Failed to create driver transaction", { error, tripId });
  }

  logger.info("Payment collected", { tripId, driverId, mode: input.paymentMode });

  return {
    success: true,
    message: "Payment collected successfully",
    data: updatedTrip,
  };
}

// ============================================
// GET DRIVER TRIPS (FOR DRIVER)
// ============================================

export async function getDriverTrips(driverId: string) {
  const trips = await repoGetTripsByDriver(driverId);

  return {
    success: true,
    message: "Driver trips retrieved successfully",
    data: trips,
  };
}
