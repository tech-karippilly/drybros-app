// src/types/penalty.dto.ts
import { z } from "zod";
import { PenaltyType } from "@prisma/client";

/**
 * Create penalty schema
 */
export const createPenaltySchema = z.object({
  name: z.string().min(1, "Penalty name is required").max(200),
  description: z.string().max(500).optional(),
  amount: z.number().int().positive("Amount must be greater than 0"),
  type: z.enum(["PENALTY", "DEDUCTION"]).default("PENALTY"),
  isActive: z.boolean().default(true),
});

export type CreatePenaltyDTO = z.infer<typeof createPenaltySchema>;

/**
 * Update penalty schema
 */
export const updatePenaltySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  amount: z.number().int().positive().optional(),
  type: z.enum(["PENALTY", "DEDUCTION"]).optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePenaltyDTO = z.infer<typeof updatePenaltySchema>;

/**
 * Apply penalty to driver schema
 */
export const applyPenaltyToDriverSchema = z.object({
  penaltyId: z.string().uuid("Invalid penalty ID"),
  amount: z.number().int().positive("Amount must be greater than 0").optional(),
  reason: z.string().max(500).optional(),
  violationDate: z.string().datetime().optional(),
});

export type ApplyPenaltyToDriverDTO = z.infer<typeof applyPenaltyToDriverSchema>;

/**
 * Apply penalty to multiple drivers schema
 */
export const applyPenaltyToDriversSchema = z.object({
  penaltyId: z.string().uuid("Invalid penalty ID"),
  driverIds: z.array(z.string().uuid("Invalid driver ID")).min(1, "At least one driver ID is required"),
  amount: z.number().int().positive("Amount must be greater than 0").optional(),
  reason: z.string().max(500).optional(),
  violationDate: z.string().datetime().optional(),
});

export type ApplyPenaltyToDriversDTO = z.infer<typeof applyPenaltyToDriversSchema>;

/**
 * Set daily limit schema (single driver)
 */
export const setDriverDailyLimitSchema = z.object({
  dailyTargetAmount: z.number().int().positive("Daily limit must be greater than 0"),
});

export type SetDriverDailyLimitDTO = z.infer<typeof setDriverDailyLimitSchema>;

/**
 * Set daily limit for multiple drivers schema
 */
export const setDriversDailyLimitSchema = z.object({
  driverIds: z.array(z.string().uuid("Invalid driver ID")).min(1, "At least one driver ID is required").optional(),
  franchiseId: z.string().uuid("Invalid franchise ID").optional(),
  dailyTargetAmount: z.number().int().positive("Daily limit must be greater than 0"),
});

export type SetDriversDailyLimitDTO = z.infer<typeof setDriversDailyLimitSchema>;

/**
 * Penalty response DTO
 */
export interface PenaltyResponseDTO {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  type: PenaltyType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Driver penalty response DTO
 */
export interface DriverPenaltyResponseDTO {
  id: string;
  driverId: string;
  penaltyId: string;
  amount: number;
  reason: string | null;
  violationDate: Date;
  appliedAt: Date;
  appliedBy: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    driverCode: string;
  };
  penalty?: PenaltyResponseDTO;
  appliedByUser?: {
    id: string;
    fullName: string;
    email: string;
  };
}

/**
 * Pagination query for penalties
 */
export const penaltyPaginationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  limit: z.string().optional().default("20").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive().max(100)),
  isActive: z.string().optional().transform((val) => val === "true"),
  type: z.enum(["PENALTY", "DEDUCTION"]).optional(),
});

export type PenaltyPaginationQueryDTO = z.infer<typeof penaltyPaginationQuerySchema>;

/**
 * Pagination query for driver penalties
 */
export const driverPenaltyPaginationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  limit: z.string().optional().default("20").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive().max(100)),
  driverId: z.string().uuid("Invalid driver ID").optional(),
  penaltyId: z.string().uuid("Invalid penalty ID").optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type DriverPenaltyPaginationQueryDTO = z.infer<typeof driverPenaltyPaginationQuerySchema>;

/**
 * Paginated penalty response
 */
export interface PaginatedPenaltyResponseDTO {
  data: PenaltyResponseDTO[];
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
 * Paginated driver penalty response
 */
export interface PaginatedDriverPenaltyResponseDTO {
  data: DriverPenaltyResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
