/**
 * Trip validation utilities - extracted to reduce duplication
 */

import { Driver, Trip } from "@prisma/client";
import prisma from "../config/prismaClient";
import { ACTIVE_DRIVER_ASSIGNED_TRIP_STATUSES } from "../constants/trip";

/**
 * Validates if a driver is eligible for trip assignment
 */
export async function validateDriverForTripAssignment(
  driver: Driver,
  trip: Trip,
  franchiseId?: string
): Promise<void> {
  // Validate franchise match
  const expectedFranchiseId = franchiseId || trip.franchiseId;
  if (driver.franchiseId !== expectedFranchiseId) {
    const err: any = new Error("Driver belongs to different franchise");
    err.statusCode = 400;
    throw err;
  }

  // Validate driver status
  if (driver.status !== "ACTIVE" || !driver.isActive) {
    const err: any = new Error("Driver is not active");
    err.statusCode = 400;
    throw err;
  }

  // Validate driver is not banned
  if (driver.bannedGlobally) {
    const err: any = new Error("Driver is globally banned");
    err.statusCode = 400;
    throw err;
  }

  // Validate license
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
        in: ACTIVE_DRIVER_ASSIGNED_TRIP_STATUSES,
      },
    },
  });

  if (activeTrips > 0) {
    const err: any = new Error("Driver already has an active trip");
    err.statusCode = 400;
    throw err;
  }
}

/**
 * Validates trip is eligible for driver assignment
 */
export function validateTripForAssignment(trip: Trip): void {
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
}

/**
 * Batch check which drivers have active trips
 * Returns a Set of driver IDs that have active trips
 */
export async function getDriversWithActiveTrips(
  driverIds: string[]
): Promise<Set<string>> {
  if (driverIds.length === 0) return new Set();

  const activeTrips = await prisma.trip.findMany({
    where: {
      driverId: {
        in: driverIds,
      },
      status: {
        in: ACTIVE_DRIVER_ASSIGNED_TRIP_STATUSES,
      },
    },
    select: {
      driverId: true,
    },
    distinct: ["driverId"],
  });

  return new Set(activeTrips.map((trip) => trip.driverId).filter(Boolean));
}
