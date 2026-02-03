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
