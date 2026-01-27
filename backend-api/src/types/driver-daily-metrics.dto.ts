// src/types/driver-daily-metrics.dto.ts
import { z } from "zod";

// Create Driver Daily Metrics Schema
export const createDriverDailyMetricsSchema = z.object({
  driverId: z.string().uuid("Driver ID must be a valid UUID"),
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    z.date(),
  ]).transform((val) => val instanceof Date ? val : new Date(val)),
  numberOfTrips: z.number().int().nonnegative().default(0),
  numberOfComplaints: z.number().int().nonnegative().default(0),
  distanceTraveled: z.number().nonnegative().default(0),
  tripAverageRating: z.number().min(0).max(5).optional(),
  overallRating: z.number().min(0).max(5).optional(),
  dailyLimit: z.number().nonnegative().optional(),
  remainingLimit: z.number().nonnegative().optional(),
  incentive: z.number().nonnegative().optional(),
  bonus: z.number().nonnegative().optional(),
  cashInHand: z.number().nonnegative().default(0),
  cashSubmittedOnDate: z.number().nonnegative().default(0),
});

export type CreateDriverDailyMetricsDTO = z.infer<typeof createDriverDailyMetricsSchema>;

// Update Driver Daily Metrics Schema (all fields optional)
export const updateDriverDailyMetricsSchema = z.object({
  numberOfTrips: z.number().int().nonnegative().optional(),
  numberOfComplaints: z.number().int().nonnegative().optional(),
  distanceTraveled: z.number().nonnegative().optional(),
  tripAverageRating: z.number().min(0).max(5).optional(),
  overallRating: z.number().min(0).max(5).optional(),
  dailyLimit: z.number().nonnegative().optional(),
  remainingLimit: z.number().nonnegative().optional(),
  incentive: z.number().nonnegative().optional(),
  bonus: z.number().nonnegative().optional(),
  cashInHand: z.number().nonnegative().optional(),
  cashSubmittedOnDate: z.number().nonnegative().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

export type UpdateDriverDailyMetricsDTO = z.infer<typeof updateDriverDailyMetricsSchema>;

// Driver Daily Metrics Response DTO
export interface DriverDailyMetricsResponseDTO {
  id: string;
  driverId: string;
  date: Date;
  numberOfTrips: number;
  numberOfComplaints: number;
  distanceTraveled: number;
  tripAverageRating: number | null;
  overallRating: number | null;
  dailyLimit: number | null;
  remainingLimit: number | null;
  incentive: number | null;
  bonus: number | null;
  cashInHand: number;
  cashSubmittedOnDate: number;
  createdAt: Date;
  updatedAt: Date;
}

// Query schema for getting daily metrics
export const getDriverDailyMetricsQuerySchema = z.object({
  driverId: z.string().uuid("Driver ID must be a valid UUID"),
  startDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    z.date(),
  ]).transform((val) => val instanceof Date ? val : new Date(val)).optional(),
  endDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    z.date(),
  ]).transform((val) => val instanceof Date ? val : new Date(val)).optional(),
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    z.date(),
  ]).transform((val) => val instanceof Date ? val : new Date(val)).optional(),
});

export type GetDriverDailyMetricsQueryDTO = z.infer<typeof getDriverDailyMetricsQuerySchema>;

// Pagination for daily metrics
export const paginatedDailyMetricsQuerySchema = z.object({
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  startDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    z.date(),
  ]).transform((val) => val instanceof Date ? val : new Date(val)).optional(),
  endDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
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

export type PaginatedDailyMetricsQueryDTO = z.infer<typeof paginatedDailyMetricsQuerySchema>;

export interface PaginatedDriverDailyMetricsResponseDTO {
  data: DriverDailyMetricsResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
