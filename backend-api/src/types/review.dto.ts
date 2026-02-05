import { z } from "zod";

export const createTripReviewSchema = z.object({
  tripId: z.string().uuid("Trip ID must be a valid UUID"),
  driverId: z.string().uuid("Driver ID must be a valid UUID"),
  franchiseId: z.string().uuid("Franchise ID must be a valid UUID"),
  customerId: z.string().uuid("Customer ID must be a valid UUID"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().min(1, "Comment is required").max(2000, "Comment must be less than 2000 characters").trim(),
});

export type CreateTripReviewDTO = z.infer<typeof createTripReviewSchema>;

export interface TripReviewResponseDTO {
  id: string;
  tripId: string;
  driverId: string;
  franchiseId: string;
  customerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Schema for creating review link
export const createReviewLinkSchema = z.object({
  tripId: z.string().uuid("Trip ID must be a valid UUID"),
});

export type CreateReviewLinkDTO = z.infer<typeof createReviewLinkSchema>;

export interface ReviewLinkResponseDTO {
  reviewLink: string;
  token: string;
  expiresAt: Date;
}

// Schema for submitting review via token
export const submitReviewWithTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  tripRating: z.number().int().min(1, "Trip rating must be at least 1").max(5, "Trip rating must be at most 5"),
  overallRating: z.number().int().min(1, "Overall rating must be at least 1").max(5, "Overall rating must be at most 5"),
  driverRating: z.number().int().min(1, "Driver rating must be at least 1").max(5, "Driver rating must be at most 5"),
  comment: z.string().min(1, "Comment is required").max(2000, "Comment must be less than 2000 characters").trim(),
});

export type SubmitReviewWithTokenDTO = z.infer<typeof submitReviewWithTokenSchema>;

export interface SubmitReviewResponseDTO {
  message: string;
  reviewId: string;
}
