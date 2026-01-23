// src/services/rating.service.ts
import {
  createDriverRating as repoCreateDriverRating,
  getRatingById,
  getRatingsPaginated,
  getAllRatings,
  getRatingByTripId,
  calculateDriverAverageRating,
  updateDriverCurrentRating,
} from "../repositories/rating.repository";
import { getDriverById } from "../repositories/driver.repository";
import { getTripById } from "../repositories/trip.repository";
import {
  CreateDriverRatingDTO,
  DriverRatingResponseDTO,
  RatingPaginationQueryDTO,
  PaginatedDriverRatingResponseDTO,
} from "../types/rating.dto";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { RATING_ERROR_MESSAGES } from "../constants/rating";
import logger from "../config/logger";
import { logActivity } from "./activity.service";
import { ActivityAction, ActivityEntityType } from "@prisma/client";

function mapRatingToResponse(rating: any): DriverRatingResponseDTO {
  return {
    id: rating.id,
    driverId: rating.driverId,
    tripId: rating.tripId,
    customerName: rating.customerName,
    customerPhone: rating.customerPhone,
    customerEmail: rating.customerEmail,
    overallRating: rating.overallRating,
    experience: rating.experience,
    drivingSafety: rating.drivingSafety,
    drivingSmoothness: rating.drivingSmoothness,
    behaviorPoliteness: rating.behaviorPoliteness,
    isVerified: rating.isVerified,
    createdAt: rating.createdAt,
    updatedAt: rating.updatedAt,
  };
}

export async function createDriverRating(
  input: CreateDriverRatingDTO
): Promise<{ message: string; data: DriverRatingResponseDTO }> {
  // Verify driver exists
  const driver = await getDriverById(input.driverId);
  if (!driver) {
    throw new NotFoundError(RATING_ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  // If tripId is provided, verify trip exists and check if rating already exists
  if (input.tripId) {
    const trip = await getTripById(input.tripId);
    if (!trip) {
      throw new NotFoundError(RATING_ERROR_MESSAGES.TRIP_NOT_FOUND);
    }

    // Check if rating already exists for this trip
    const existingRating = await getRatingByTripId(input.tripId);
    if (existingRating) {
      throw new BadRequestError(RATING_ERROR_MESSAGES.RATING_ALREADY_EXISTS);
    }
  }

  // Validate rating values
  if (
    input.overallRating < 1 || input.overallRating > 5 ||
    input.drivingSafety < 1 || input.drivingSafety > 5 ||
    input.drivingSmoothness < 1 || input.drivingSmoothness > 5 ||
    input.behaviorPoliteness < 1 || input.behaviorPoliteness > 5
  ) {
    throw new BadRequestError(RATING_ERROR_MESSAGES.INVALID_RATING_VALUE);
  }

  const rating = await repoCreateDriverRating({
    driverId: input.driverId,
    tripId: input.tripId || null,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail || null,
    overallRating: input.overallRating,
    experience: input.experience || null,
    drivingSafety: input.drivingSafety,
    drivingSmoothness: input.drivingSmoothness,
    behaviorPoliteness: input.behaviorPoliteness,
  });

  // Update driver's average rating
  const averageRating = await calculateDriverAverageRating(input.driverId);
  await updateDriverCurrentRating(input.driverId, averageRating).catch((err) => {
    logger.error("Failed to update driver average rating", { error: err, driverId: input.driverId });
  });

  logger.info("Driver rating created", {
    ratingId: rating.id,
    driverId: input.driverId,
    tripId: input.tripId,
    overallRating: input.overallRating,
  });

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.RATING_SUBMITTED,
    entityType: ActivityEntityType.RATING,
    entityId: rating.id,
    franchiseId: driver.franchiseId,
    driverId: input.driverId,
    tripId: input.tripId || null,
    description: `Rating submitted for driver - Overall: ${input.overallRating}/5, Safety: ${input.drivingSafety}/5, Smoothness: ${input.drivingSmoothness}/5, Politeness: ${input.behaviorPoliteness}/5`,
    metadata: {
      ratingId: rating.id,
      driverId: input.driverId,
      tripId: input.tripId,
      overallRating: input.overallRating,
      drivingSafety: input.drivingSafety,
      drivingSmoothness: input.drivingSmoothness,
      behaviorPoliteness: input.behaviorPoliteness,
      customerName: input.customerName,
    },
  }).catch((err) => {
    logger.error("Failed to log rating activity", { error: err });
  });

  return {
    message: "Rating submitted successfully",
    data: mapRatingToResponse(rating),
  };
}

export async function listRatings(
  filters?: { driverId?: string; tripId?: string }
): Promise<DriverRatingResponseDTO[]> {
  const ratings = await getAllRatings(filters);
  return ratings.map(mapRatingToResponse);
}

export async function listRatingsPaginated(
  pagination: RatingPaginationQueryDTO
): Promise<PaginatedDriverRatingResponseDTO> {
  const { page, limit, driverId, tripId } = pagination;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (driverId) filters.driverId = driverId;
  if (tripId) filters.tripId = tripId;

  const { data, total } = await getRatingsPaginated(skip, limit, filters);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapRatingToResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
}

export async function getRating(id: string): Promise<DriverRatingResponseDTO> {
  const rating = await getRatingById(id);
  if (!rating) {
    throw new NotFoundError(RATING_ERROR_MESSAGES.RATING_NOT_FOUND);
  }
  return mapRatingToResponse(rating);
}
