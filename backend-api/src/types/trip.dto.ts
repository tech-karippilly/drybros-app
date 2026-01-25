// src/types/trip.dto.ts
import { z } from "zod";

/**
 * Zod schema for rescheduling a trip
 */
export const rescheduleTripSchema = z.object({
  tripDate: z
    .string()
    .min(1, "tripDate is required")
    .trim(),
  tripTime: z
    .string()
    .min(1, "tripTime is required")
    .trim(),
});

export type RescheduleTripDTO = z.infer<typeof rescheduleTripSchema>;

/**
 * Zod schema for cancelling a trip
 */
export const cancelTripSchema = z.object({
  cancelledBy: z.enum(["OFFICE", "CUSTOMER"], {
    message: "cancelledBy must be OFFICE or CUSTOMER",
  }),
  reason: z
    .string()
    .max(500, "Reason must be less than 500 characters")
    .trim()
    .optional()
    .nullable(),
});

export type CancelTripDTO = z.infer<typeof cancelTripSchema>;

/**
 * Zod schema for reassigning driver to a trip
 */
export const reassignDriverSchema = z.object({
  driverId: z.string().uuid("Driver ID must be a valid UUID"),
  franchiseId: z.string().uuid("Franchise ID must be a valid UUID").optional(),
});

export type ReassignDriverDTO = z.infer<typeof reassignDriverSchema>;

/**
 * Zod schema for assigning a driver to a trip (POST /trips/assign-driver).
 * Franchise is derived from the trip; only tripId and driverId are required.
 */
export const assignDriverSchema = z.object({
  tripId: z.string().uuid("Trip ID must be a valid UUID"),
  driverId: z.string().uuid("Driver ID must be a valid UUID"),
});

export type AssignDriverDTO = z.infer<typeof assignDriverSchema>;
