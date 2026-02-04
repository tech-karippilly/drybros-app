// src/types/trip.dto.ts
import { z } from "zod";

/**
 * Zod schema for creating a trip
 */
export const createTripSchema = z.object({
  franchiseId: z.number().int("Franchise ID must be an integer"),
  driverId: z.number().int("Driver ID must be an integer"),
  customerId: z.string().uuid("Customer ID must be a valid UUID"),
  tripType: z.string().min(1, "Trip type is required"),
  pickupLocation: z.string().min(1, "Pickup location is required"),
  pickupLat: z.number().optional().nullable(),
  pickupLng: z.number().optional().nullable(),
  dropLocation: z.string().optional().nullable(),
  dropLat: z.number().optional().nullable(),
  dropLng: z.number().optional().nullable(),
  destinationLat: z.number().optional().nullable(),
  destinationLng: z.number().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  baseAmount: z.number().int("Base amount must be an integer"),
  extraAmount: z.number().int("Extra amount must be an integer").optional(),
});

export type CreateTripDTO = z.infer<typeof createTripSchema>;

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
