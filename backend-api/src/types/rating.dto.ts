// src/types/rating.dto.ts
import { z } from "zod";

/**
 * Zod schema for creating a driver rating (without authentication)
 */
export const createDriverRatingSchema = z.object({
  driverId: z.string().uuid("Driver ID must be a valid UUID"),
  tripId: z.string().uuid("Trip ID must be a valid UUID").optional(),
  customerName: z.string().min(1, "Customer name is required").max(100, "Name must be less than 100 characters").trim(),
  customerPhone: z.string().min(10, "Phone number must be at least 10 characters").max(20, "Phone number must be less than 20 characters").trim(),
  customerEmail: z.string().email("Invalid email format").max(255, "Email must be less than 255 characters").toLowerCase().trim().optional(),
  overallRating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  experience: z.string().max(1000, "Experience description must be less than 1000 characters").trim().optional().nullable(),
  drivingSafety: z.number().min(1, "Safety rating must be at least 1").max(5, "Safety rating must be at most 5"),
  drivingSmoothness: z.number().min(1, "Smoothness rating must be at least 1").max(5, "Smoothness rating must be at most 5"),
  behaviorPoliteness: z.number().min(1, "Politeness rating must be at least 1").max(5, "Politeness rating must be at most 5"),
});

export type CreateDriverRatingDTO = z.infer<typeof createDriverRatingSchema>;

/**
 * Driver rating response DTO
 */
export interface DriverRatingResponseDTO {
  id: string;
  driverId: string;
  tripId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  overallRating: number;
  experience: string | null;
  drivingSafety: number;
  drivingSmoothness: number;
  behaviorPoliteness: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pagination query schema for ratings
 */
export const ratingPaginationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  limit: z.string().optional().default("10").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive().max(100)),
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  tripId: z.string().uuid("Trip ID must be a valid UUID").optional(),
});

export type RatingPaginationQueryDTO = z.infer<typeof ratingPaginationQuerySchema>;

export interface PaginatedDriverRatingResponseDTO {
  data: DriverRatingResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
