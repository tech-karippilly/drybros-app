import prisma from "../config/prismaClient";
import { TripOfferStatus } from "@prisma/client";

export type CreateTripOfferInput = {
  tripId: string;
  driverId: string;
  expiresAt: Date;
};

export async function createTripOffer(input: CreateTripOfferInput) {
  return prisma.tripOffer.create({
    data: {
      tripId: input.tripId,
      driverId: input.driverId,
      expiresAt: input.expiresAt,
      status: TripOfferStatus.OFFERED,
    },
  });
}

export async function listPendingOffersForDriver(driverId: string, now: Date = new Date()) {
  return prisma.tripOffer.findMany({
    where: {
      driverId,
      status: TripOfferStatus.OFFERED,
      expiresAt: { gt: now },
    },
    orderBy: { offeredAt: "desc" },
    include: { Trip: true },
  });
}

export async function getTripOfferById(id: string) {
  return prisma.tripOffer.findUnique({
    where: { id },
    include: { Trip: true, Driver: true },
  });
}

/**
 * Idempotent accept: if already ACCEPTED, returns existing row.
 * Ensures the offer belongs to the driver.
 */
export async function acceptTripOffer(offerId: string, driverId: string, acceptedAt: Date = new Date()) {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.tripOffer.findUnique({ where: { id: offerId } });
    if (!offer) return null;
    if (offer.driverId !== driverId) return null;

    if (offer.status === TripOfferStatus.ACCEPTED) return offer;
    if (offer.status !== TripOfferStatus.OFFERED) return offer; // expired/cancelled/rejected

    // If expired, mark expired.
    if (offer.expiresAt <= acceptedAt) {
      return tx.tripOffer.update({
        where: { id: offerId },
        data: { status: TripOfferStatus.EXPIRED },
      });
    }

    return tx.tripOffer.update({
      where: { id: offerId },
      data: {
        status: TripOfferStatus.ACCEPTED,
        acceptedAt,
      },
    });
  });
}

export async function updateTripOfferStatus(
  offerId: string,
  status: TripOfferStatus,
  timestamp: Date = new Date()
) {
  const patch: Record<string, any> = { status };
  if (status === TripOfferStatus.REJECTED) patch.rejectedAt = timestamp;
  if (status === TripOfferStatus.ACCEPTED) patch.acceptedAt = timestamp;

  return prisma.tripOffer.update({
    where: { id: offerId },
    data: patch,
  });
}

/**
 * Get count of all offer attempts for a trip (regardless of status).
 * Used to enforce max attempt limits.
 */
export async function getTripOfferAttemptCount(tripId: string): Promise<number> {
  return prisma.tripOffer.count({
    where: { tripId },
  });
}

/**
 * Get list of all driver IDs who have been offered this trip.
 * Useful for exclusion logic and reporting.
 */
export async function getTripOfferedDriverIds(tripId: string): Promise<string[]> {
  const offers = await prisma.tripOffer.findMany({
    where: { tripId },
    select: { driverId: true },
    distinct: ['driverId'],
  });
  return offers.map((o) => o.driverId);
}

/**
 * Get detailed offer attempt history for a trip.
 * Useful for debugging and admin dashboards.
 */
export async function getTripOfferHistory(tripId: string) {
  return prisma.tripOffer.findMany({
    where: { tripId },
    include: {
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
          currentRating: true,
        },
      },
    },
    orderBy: { offeredAt: 'asc' },
  });
}
