import { BadRequestError, NotFoundError } from "../utils/errors";
import { createTripReview, getTripReviewById } from "../repositories/tripReview.repository";
import { CreateTripReviewDTO, TripReviewResponseDTO } from "../types/review.dto";
import { getTripById } from "../repositories/trip.repository";
import { getDriverById } from "../repositories/driver.repository";
import prisma from "../config/prismaClient";

export async function submitTripReview(input: CreateTripReviewDTO): Promise<{ message: string; data: TripReviewResponseDTO }> {
  if (input.rating < 1 || input.rating > 5) {
    throw new BadRequestError("Rating must be between 1 and 5");
  }

  const [trip, driver, customer, franchise] = await Promise.all([
    getTripById(input.tripId),
    getDriverById(input.driverId),
    prisma.customer.findUnique({ where: { id: input.customerId } }),
    prisma.franchise.findUnique({ where: { id: input.franchiseId } }),
  ]);

  if (!trip) throw new NotFoundError("Trip not found");
  if (!driver) throw new NotFoundError("Driver not found");
  if (!customer) throw new NotFoundError("Customer not found");
  if (!franchise) throw new NotFoundError("Franchise not found");

  const review = await createTripReview({
    tripId: input.tripId,
    driverId: input.driverId,
    franchiseId: input.franchiseId,
    customerId: input.customerId,
    rating: input.rating,
    comment: input.comment,
  });

  // Recalculate and update franchise average rating
  try {
    const average = await prisma.tripReview.aggregate({
      where: { franchiseId: input.franchiseId },
      _avg: { rating: true },
    });
    const avg = average._avg.rating ?? null;
    await prisma.franchise.update({ where: { id: input.franchiseId }, data: { averageRating: avg } });
  } catch (err) {
    // Log but don't fail the request
    console.error("Failed to update franchise average rating", err);
  }

  return {
    message: "Trip review submitted successfully",
    data: {
      id: review.id,
      tripId: review.tripId,
      driverId: review.driverId,
      franchiseId: review.franchiseId,
      customerId: review.customerId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    },
  };
}

export async function getTripReview(id: string): Promise<{ data: TripReviewResponseDTO | null }> {
  const review = await getTripReviewById(id);
  if (!review) {
    return { data: null };
  }
  return {
    data: {
      id: review.id,
      tripId: review.tripId,
      driverId: review.driverId,
      franchiseId: review.franchiseId,
      customerId: review.customerId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    },
  };
}
