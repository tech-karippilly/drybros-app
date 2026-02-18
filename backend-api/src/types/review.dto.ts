import { z } from "zod";

// ============================================
// TRIP REVIEW DTO
// ============================================

export const submitTripReviewSchema = z.object({
  tripId: z.string().uuid("Invalid trip ID format"),
  tripRating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  overallRating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  driverRating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().max(1000, "Comment too long").optional(),
});

export type SubmitTripReviewDTO = z.infer<typeof submitTripReviewSchema>;

// ============================================
// DRIVER RATING DTO
// ============================================

export const submitDriverRatingSchema = z.object({
  driverId: z.string().uuid("Invalid driver ID format"),
  tripId: z.string().uuid("Invalid trip ID format").optional(),
  overallRating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  drivingSafety: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  drivingSmoothness: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  behaviorPoliteness: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  experience: z.string().max(1000, "Experience text too long").optional(),
});

export type SubmitDriverRatingDTO = z.infer<typeof submitDriverRatingSchema>;

// ============================================
// RESPONSE DTOs
// ============================================

export interface TripReviewResponseDTO {
  id: string;
  tripId: string;
  customerId: string;
  franchiseId: string;
  driverId: string | null;
  tripRating: number;
  overallRating: number;
  driverRating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  Trip?: any;
  Customer?: any;
  Driver?: any;
}

export interface SingleTripReviewResponseDTO {
  success: true;
  message: string;
  data: TripReviewResponseDTO;
}

export interface DriverRatingResponseDTO {
  id: string;
  driverId: string;
  tripId: string | null;
  customerId: string;
  overallRating: number;
  drivingSafety: number;
  drivingSmoothness: number;
  behaviorPoliteness: number;
  experience: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  Driver?: any;
  Customer?: any;
  Trip?: any;
}

export interface SingleDriverRatingResponseDTO {
  success: true;
  message: string;
  data: DriverRatingResponseDTO;
}
