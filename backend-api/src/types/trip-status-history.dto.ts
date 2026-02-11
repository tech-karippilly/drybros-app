// src/types/trip-status-history.dto.ts
import { z } from "zod";
import { TripEventType, TripStatus } from "@prisma/client";

// Create Trip Status History Schema
export const createTripStatusHistorySchema = z.object({
  tripId: z.string().uuid("Trip ID must be a valid UUID"),
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  eventType: z.nativeEnum(TripEventType),
  status: z.nativeEnum(TripStatus).optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(), // JSON object
  createdBy: z.string().uuid("User ID must be a valid UUID").optional(),
});

export type CreateTripStatusHistoryDTO = z.infer<typeof createTripStatusHistorySchema>;

// Trip Status History Response DTO
export interface TripStatusHistoryResponseDTO {
  id: string;
  tripId: string;
  driverId: string | null;
  eventType: TripEventType;
  status: TripStatus | null;
  description: string | null;
  metadata: Record<string, any> | null;
  occurredAt: Date;
  createdBy: string | null;
}

// Query schema for getting trip status history
export const getTripStatusHistoryQuerySchema = z.object({
  tripId: z.string().uuid("Trip ID must be a valid UUID").optional(),
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  eventType: z.nativeEnum(TripEventType).optional(),
  startDate: z.union([
    z.string().datetime("Invalid date format"),
    z.date(),
  ]).transform((val) => val instanceof Date ? val : new Date(val)).optional(),
  endDate: z.union([
    z.string().datetime("Invalid date format"),
    z.date(),
  ]).transform((val) => val instanceof Date ? val : new Date(val)).optional(),
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100)),
});

export type GetTripStatusHistoryQueryDTO = z.infer<typeof getTripStatusHistoryQuerySchema>;

export interface PaginatedTripStatusHistoryResponseDTO {
  data: TripStatusHistoryResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Helper function to map Prisma model to DTO
export function mapTripStatusHistoryToResponse(history: any): TripStatusHistoryResponseDTO {
  return {
    id: history.id,
    tripId: history.tripId,
    driverId: history.driverId,
    eventType: history.eventType,
    status: history.status,
    description: history.description,
    metadata: history.metadata as Record<string, any> | null,
    occurredAt: history.occurredAt,
    createdBy: history.createdBy,
  };
}
