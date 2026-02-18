import prisma from "../config/prismaClient";
import { TripStatus } from "@prisma/client";
import {
  SubmitTripReviewDTO,
  SubmitDriverRatingDTO,
} from "../types/review.dto";
import logger from "../config/logger";

// ============================================
// SUBMIT TRIP REVIEW
// ============================================

export async function submitTripReview(
  input: SubmitTripReviewDTO,
  customerId: string
) {
  // Get trip
  const trip = await prisma.trip.findUnique({
    where: { id: input.tripId },
    select: {
      id: true,
      status: true,
      customerId: true,
      driverId: true,
      franchiseId: true,
    },
  });

  if (!trip) {
    const error: any = new Error("Trip not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate trip is completed
  if (trip.status !== TripStatus.COMPLETED && trip.status !== "PAYMENT_DONE" as any) {
    const error: any = new Error("Trip must be completed before submitting review");
    error.statusCode = 400;
    throw error;
  }

  // Validate customer owns this trip
  if (trip.customerId !== customerId) {
    const error: any = new Error("You can only review your own trips");
    error.statusCode = 403;
    throw error;
  }

  // Check if review already exists
  const existingReview = await prisma.tripReview.findFirst({
    where: {
      tripId: input.tripId,
      customerId,
    },
  });

  if (existingReview) {
    const error: any = new Error("You have already reviewed this trip");
    error.statusCode = 400;
    throw error;
  }

  // Create review
  const review = await prisma.tripReview.create({
    data: {
      tripId: input.tripId,
      customerId,
      franchiseId: trip.franchiseId,
      driverId: trip.driverId,
      tripRating: input.tripRating,
      overallRating: input.overallRating,
      driverRating: input.driverRating,
      comment: input.comment || null,
    },
    include: {
      Trip: true,
      Customer: true,
      Driver: true,
    },
  });

  // Update driver's current rating (average of all ratings)
  if (trip.driverId) {
    const avgRating = await prisma.tripReview.aggregate({
      where: { driverId: trip.driverId },
      _avg: { overallRating: true },
    });

    if (avgRating._avg.overallRating) {
      await prisma.driver.update({
        where: { id: trip.driverId },
        data: { currentRating: avgRating._avg.overallRating },
      });
    }
  }

  logger.info("Trip review submitted", {
    reviewId: review.id,
    tripId: input.tripId,
    customerId,
  });

  return {
    success: true,
    message: "Trip review submitted successfully",
    data: review,
  };
}

// ============================================
// SUBMIT DRIVER RATING
// ============================================

export async function submitDriverRating(
  input: SubmitDriverRatingDTO,
  customerId: string
) {
  // Validate driver exists
  const driver = await prisma.driver.findUnique({
    where: { id: input.driverId },
    select: { id: true, status: true },
  });

  if (!driver) {
    const error: any = new Error("Driver not found");
    error.statusCode = 404;
    throw error;
  }

  // If tripId provided, validate trip
  if (input.tripId) {
    const trip = await prisma.trip.findUnique({
      where: { id: input.tripId },
      select: {
        id: true,
        status: true,
        customerId: true,
        driverId: true,
      },
    });

    if (!trip) {
      const error: any = new Error("Trip not found");
      error.statusCode = 404;
      throw error;
    }

    // Validate customer owns this trip
    if (trip.customerId !== customerId) {
      const error: any = new Error("You can only rate drivers from your own trips");
      error.statusCode = 403;
      throw error;
    }

    // Validate driver matches trip
    if (trip.driverId !== input.driverId) {
      const error: any = new Error("Driver does not match the trip");
      error.statusCode = 400;
      throw error;
    }
  }

  // Create rating (using proper Prisma client fields)
  const rating = await prisma.driverRating.create({
    data: {
      Driver: { connect: { id: input.driverId } },
      Trip: input.tripId ? { connect: { id: input.tripId } } : undefined,
      overallRating: input.overallRating,
      drivingSafety: input.drivingSafety,
      drivingSmoothness: input.drivingSmoothness,
      behaviorPoliteness: input.behaviorPoliteness,
      experience: input.experience || null,
    } as any, // Temp cast until schema is verified
    include: {
      Driver: true,
      Trip: true,
    },
  });

  // Update driver's current rating (average of all overall ratings)
  const avgRating = await prisma.driverRating.aggregate({
    where: { driverId: input.driverId },
    _avg: { overallRating: true },
  });

  if (avgRating._avg.overallRating) {
    await prisma.driver.update({
      where: { id: input.driverId },
      data: { currentRating: avgRating._avg.overallRating },
    });
  }

  logger.info("Driver rating submitted", {
    ratingId: rating.id,
    driverId: input.driverId,
    customerId,
  });

  return {
    success: true,
    message: "Driver rating submitted successfully",
    data: rating,
  };
}
