/**
 * Trip-related constants
 */

import { TripStatus } from "@prisma/client";

export const CAR_GEAR_TYPES = {
  MANUAL: "MANUAL",
  AUTOMATIC: "AUTOMATIC",
  EV: "EV",
} as const;

export type CarGearType = typeof CAR_GEAR_TYPES[keyof typeof CAR_GEAR_TYPES];

export const CAR_TYPE_CATEGORIES = {
  PREMIUM: "PREMIUM",
  LUXURY: "LUXURY",
  NORMAL: "NORMAL",
} as const;

export type CarTypeCategory = typeof CAR_TYPE_CATEGORIES[keyof typeof CAR_TYPE_CATEGORIES];

export const TRIP_ERROR_MESSAGES = {
  CUSTOMER_NOT_FOUND: "Customer not found",
  CUSTOMER_CREATION_FAILED: "Failed to create customer",
  TRIP_CREATION_FAILED: "Failed to create trip",
  INVALID_FRANCHISE: "Invalid franchise ID",
  INVALID_TRIP_TYPE: "Invalid trip type",
  INVALID_CAR_GEAR_TYPE: "Invalid car gear type",
  INVALID_CAR_TYPE: "Invalid car type category",
  MISSING_PICKUP_LOCATION: "Pickup location is required",
  MISSING_DESTINATION_LOCATION: "Destination location is required",
  MISSING_CUSTOMER_PHONE: "Customer phone number is required",
  MISSING_CUSTOMER_NAME: "Customer name is required",
  // Reschedule, cancel, reassign
  TRIP_NOT_FOUND: "Trip not found",
  RESCHEDULE_NOT_ALLOWED: "Trip cannot be rescheduled in current status",
  CANCEL_NOT_ALLOWED: "Trip cannot be cancelled in current status",
  REASSIGN_NOT_ALLOWED: "Trip cannot be reassigned in current status",
  MISSING_TRIP_DATE: "tripDate is required for reschedule",
  MISSING_TRIP_TIME: "tripTime is required for reschedule",
  MISSING_CANCELLED_BY: "cancelledBy is required (OFFICE or CUSTOMER)",
  INVALID_CANCELLED_BY: "cancelledBy must be OFFICE or CUSTOMER",
  TRIP_HAS_NO_DRIVER: "Trip has no driver to reassign",
  REASSIGN_SAME_DRIVER: "New driver must be different from current driver",
  // Dispatch / trip offers (request-to-drivers)
  DISPATCH_MISSING_DRIVER_ID: "driverId is required when mode is SPECIFIC",
  DISPATCH_MISSING_DRIVER_IDS: "driverIds is required when mode is LIST",
  NO_DRIVERS_AVAILABLE: "No drivers available to assign this trip",
  MAX_DRIVER_ATTEMPTS_EXCEEDED: "Maximum driver assignment attempts exceeded",
} as const;

/**
 * Trip statuses considered "active/ongoing" for a driver's assigned trips list.
 * Used by `/trips/my-assigned` and related socket event.
 */
export const ACTIVE_DRIVER_ASSIGNED_TRIP_STATUSES: TripStatus[] = [
  TripStatus.ASSIGNED,
  TripStatus.DRIVER_ACCEPTED,
  TripStatus.DRIVER_ON_THE_WAY,
  TripStatus.TRIP_STARTED,
  TripStatus.TRIP_PROGRESS,
  TripStatus.IN_PROGRESS,
];

/** Trip statuses that allow reschedule (before trip has started) */
export const RESCHEDULABLE_TRIP_STATUSES = [
  "PENDING",
  "NOT_ASSIGNED",
  "REQUESTED",
  "ASSIGNED",
  "DRIVER_ACCEPTED",
] as const;

/** Trip statuses that allow cancel */
export const CANCELLABLE_TRIP_STATUSES = [
  "PENDING",
  "NOT_ASSIGNED",
  "REQUESTED",
  "ASSIGNED",
  "DRIVER_ACCEPTED",
] as const;

/** Trip statuses that allow driver reassign (has driver, not started) */
export const REASSIGNABLE_TRIP_STATUSES = [
  "ASSIGNED",
  "DRIVER_ACCEPTED",
] as const;

/** Trip history – late start detection */
export const TRIP_HISTORY_LATE = {
  EVENT_TYPE: "trip_started_late",
  EVENT_NAME: "Started Late",
  /** Description format: use {minutes} placeholder */
  DESCRIPTION_FORMAT: "Trip started {minutes} minute(s) after scheduled time",
} as const;
