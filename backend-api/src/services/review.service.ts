import { BadRequestError, NotFoundError } from "../utils/errors";
import { createTripReview, getTripReviewById } from "../repositories/tripReview.repository";
import { CreateTripReviewDTO, TripReviewResponseDTO, ReviewLinkResponseDTO, SubmitReviewWithTokenDTO, SubmitReviewResponseDTO } from "../types/review.dto";
import { getTripById } from "../repositories/trip.repository";
import { getDriverById } from "../repositories/driver.repository";
import prisma from "../config/prismaClient";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/authConfig";
import appConfig from "../config/appConfig";

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

/**
 * Generate a review link for a trip
 * Creates a JWT token containing trip details
 */
export async function createReviewLink(tripId: string): Promise<ReviewLinkResponseDTO> {
  // Validate trip exists
  const trip = await getTripById(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  // Check if trip has required data
  if (!trip.driverId) {
    throw new BadRequestError("Trip does not have an assigned driver");
  }
  if (!trip.customerId) {
    throw new BadRequestError("Trip does not have an assigned customer");
  }

  // Create token with trip details (expires in 30 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const token = jwt.sign(
    {
      tripId: trip.id,
      driverId: trip.driverId,
      customerId: trip.customerId,
      franchiseId: trip.franchiseId,
      type: "review_link",
    },
    authConfig.jwtSecret,
    { expiresIn: "30d" }
  );

  // Construct review link
  const reviewLink = `${appConfig.frontendUrlBase}/review/submit?token=${token}`;

  return {
    reviewLink,
    token,
    expiresAt,
  };
}

/**
 * Submit a review using a token
 * Validates token and saves review to database
 */
export async function submitReviewWithToken(input: SubmitReviewWithTokenDTO): Promise<SubmitReviewResponseDTO> {
  // Verify and decode token
  let decoded: any;
  try {
    decoded = jwt.verify(input.token, authConfig.jwtSecret);
  } catch (err) {
    throw new BadRequestError("Invalid or expired token");
  }

  // Validate token type
  if (decoded.type !== "review_link") {
    throw new BadRequestError("Invalid token type");
  }

  const { tripId, driverId, customerId, franchiseId } = decoded;

  // Validate entities exist
  const [trip, driver, customer, franchise] = await Promise.all([
    getTripById(tripId),
    getDriverById(driverId),
    prisma.customer.findUnique({ where: { id: customerId } }),
    prisma.franchise.findUnique({ where: { id: franchiseId } }),
  ]);

  if (!trip) throw new NotFoundError("Trip not found");
  if (!driver) throw new NotFoundError("Driver not found");
  if (!customer) throw new NotFoundError("Customer not found");
  if (!franchise) throw new NotFoundError("Franchise not found");

  // Check if review already exists for this trip
  const existingReview = await prisma.tripReview.findFirst({
    where: { tripId },
  });

  if (existingReview) {
    throw new BadRequestError("Review already submitted for this trip");
  }

  // Create review
  const review = await prisma.tripReview.create({
    data: {
      tripId,
      driverId,
      franchiseId,
      customerId,
      tripRating: input.tripRating,
      overallRating: input.overallRating,
      driverRating: input.driverRating,
      comment: input.comment,
    },
  });

  // Update franchise average rating
  try {
    const average = await prisma.tripReview.aggregate({
      where: { franchiseId },
      _avg: { overallRating: true },
    });
    const avg = average._avg.overallRating ?? null;
    await prisma.franchise.update({
      where: { id: franchiseId },
      data: { averageRating: avg },
    });
  } catch (err) {
    console.error("Failed to update franchise average rating", err);
  }

  // Update driver rating
  try {
    const driverAverage = await prisma.tripReview.aggregate({
      where: { driverId },
      _avg: { driverRating: true },
    });
    const driverAvg = driverAverage._avg.driverRating ?? null;
    await prisma.driver.update({
      where: { id: driverId },
      data: { currentRating: driverAvg },
    });
  } catch (err) {
    console.error("Failed to update driver rating", err);
  }

  return {
    message: "Review submitted successfully",
    reviewId: review.id,
  };
}
