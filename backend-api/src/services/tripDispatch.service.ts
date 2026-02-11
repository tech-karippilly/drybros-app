import prisma from "../config/prismaClient";
import { TripOfferStatus, TripStatus } from "@prisma/client";
import { DISPATCH_CONFIG, DISPATCH_RATING, DISPATCH_RATING_TIERS } from "../constants/dispatch";
import { socketService } from "./socket.service";
import { haversineDistanceKm } from "../utils/geo";
import { updateDriverTripStatus } from "../repositories/driver.repository";
import { updateTrip } from "../repositories/trip.repository";
import { emitNotification } from "./notification.service";
import logger from "../config/logger";

type DispatchState = {
  candidateDriverIds: string[];
  startedAt: Date;
};

type OfferTripOptions = {
  /**
   * When true, re-sends an offer even if a previous one is still active (OFFERED and not expired),
   * by refreshing the offer window and emitting again.
   *
   * Intended for manual "request again" flows from dispatcher UI.
   */
  forceResend?: boolean;
};

class TripDispatchService {
  private dispatchStates = new Map<string, DispatchState>();
  private offerTimers = new Map<string, NodeJS.Timeout[]>();
  private decisionTimers = new Map<string, NodeJS.Timeout>();

  private getDriverRatingTier(currentRating: number | null): number {
    if (typeof currentRating !== "number" || Number.isNaN(currentRating)) {
      return DISPATCH_RATING.UNKNOWN_TIER;
    }
    // Bucket rating into integer tiers (5→4→3→2→1). Anything outside clamps.
    const tier = Math.floor(currentRating);
    if (tier < DISPATCH_RATING.MIN_TIER) return DISPATCH_RATING.MIN_TIER;
    if (tier > DISPATCH_RATING.MAX_TIER) return DISPATCH_RATING.MAX_TIER;
    return tier;
  }

  async startDispatchForTrip(tripId: string): Promise<void> {
    if (this.dispatchStates.has(tripId)) return;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return;
    if (trip.driverId) return; // already assigned

    const candidateDriverIds = await this.listCandidateDriverIdsByRatingTiers(trip.franchiseId);

    this.dispatchStates.set(tripId, { candidateDriverIds, startedAt: new Date() });

    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < candidateDriverIds.length; i++) {
      const driverId = candidateDriverIds[i];
      const t = setTimeout(() => {
        this.offerTripToDriver(tripId, driverId).catch(() => {});
      }, i * DISPATCH_CONFIG.OFFER_INTERVAL_MS);
      timers.push(t);
    }
    this.offerTimers.set(tripId, timers);
  }

  /**
   * Immediately request a trip to all eligible drivers (no staggering).
   * Safe to call multiple times; duplicate offers are ignored.
   */
  async requestTripToAllEligibleDriversNow(tripId: string): Promise<{ requested: number }> {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return { requested: 0 };
    if (trip.driverId) return { requested: 0 };

    const candidateDriverIds = await this.listCandidateDriverIdsByRatingTiers(trip.franchiseId);

    let requested = 0;
    for (const driverId of candidateDriverIds) {
      const created = await this.offerTripToDriver(tripId, driverId, { forceResend: true });
      if (created) requested += 1;
    }

    return { requested };
  }

  /**
   * Immediately request a trip to specific driver(s), but only if they are eligible candidates.
   * Duplicate offers are ignored.
   */
  async requestTripToEligibleDriversNow(tripId: string, driverIds: string[]): Promise<{ requested: number }> {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return { requested: 0 };
    if (trip.driverId) return { requested: 0 };

    const candidateDriverIds = await this.listCandidateDriverIdsByRatingTiers(trip.franchiseId);
    const candidateSet = new Set(candidateDriverIds);

    let requested = 0;
    for (const driverId of driverIds) {
      if (!candidateSet.has(driverId)) continue;
      const created = await this.offerTripToDriver(tripId, driverId, { forceResend: true });
      if (created) requested += 1;
    }

    return { requested };
  }

  async requestTripToEligibleDriverNow(tripId: string, driverId: string): Promise<{ requested: number }> {
    return this.requestTripToEligibleDriversNow(tripId, [driverId]);
  }

  /**
   * Called after an offer transitions to ACCEPTED (REST or socket).
   * We wait a short grace window to allow multiple accepts, then assign the winner.
   */
  async notifyOfferAccepted(tripId: string): Promise<void> {
    // If already scheduled, do nothing.
    if (this.decisionTimers.has(tripId)) return;

    const timer = setTimeout(() => {
      this.finalizeAssignment(tripId).catch(() => {});
    }, DISPATCH_CONFIG.ACCEPT_GRACE_MS);
    this.decisionTimers.set(tripId, timer);
  }

  /**
   * Called after a driver rejects an offer.
   * Dispatches the trip to the next available driver who hasn't been offered yet.
   */
  async notifyOfferRejected(tripId: string, rejectedByDriverId: string): Promise<void> {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return;
    if (trip.driverId) return; // already assigned

    // Get all drivers who have already been offered this trip
    const existingOffers = await prisma.tripOffer.findMany({
      where: { tripId },
      select: { driverId: true },
    });
    const offeredDriverIds = new Set(existingOffers.map((o) => o.driverId));

    // Check if we've exceeded max attempts
    const attemptCount = existingOffers.length;
    if (attemptCount >= DISPATCH_CONFIG.MAX_OFFER_ATTEMPTS_PER_TRIP) {
      await this.handleExhaustedAttempts(tripId, trip.franchiseId, attemptCount);
      return;
    }

    // Get candidate drivers from dispatch state or rebuild list
    let candidateDriverIds = this.dispatchStates.get(tripId)?.candidateDriverIds;
    if (!candidateDriverIds) {
      candidateDriverIds = await this.listCandidateDriverIdsByRatingTiers(trip.franchiseId);
      this.dispatchStates.set(tripId, { candidateDriverIds, startedAt: new Date() });
    }

    // Find next driver who hasn't been offered yet
    const nextDriver = candidateDriverIds.find((id) => !offeredDriverIds.has(id));
    
    if (nextDriver) {
      // Offer to next driver immediately
      await this.offerTripToDriver(tripId, nextDriver);
    } else {
      // No more drivers available - all have been offered
      await this.handleExhaustedAttempts(tripId, trip.franchiseId, attemptCount);
    }
  }

  /**
   * Called when an offer expires without driver response.
   * Behaves like rejection - tries next driver.
   * 
   * This is the entry point for the OfferExpirationService.
   */
  async handleExpiredOffer(tripId: string, expiredForDriverId: string): Promise<void> {
    // Reuse the rejection logic - expiration is treated like rejection
    await this.notifyOfferRejected(tripId, expiredForDriverId);
  }

  /**
   * Called when all eligible drivers have been offered and none accepted.
   * Marks trip as NOT_ASSIGNED and notifies admin.
   */
  private async handleExhaustedAttempts(
    tripId: string,
    franchiseId: string,
    attemptCount: number
  ): Promise<void> {
    logger.warn("Exhausted all driver attempts for trip", {
      tripId,
      franchiseId,
      attemptCount,
      maxAttempts: DISPATCH_CONFIG.MAX_OFFER_ATTEMPTS_PER_TRIP,
    });

    // Keep trip as NOT_ASSIGNED (don't change to a different status)
    // This allows manual reassignment by dispatchers
    await updateTrip(tripId, {
      status: TripStatus.NOT_ASSIGNED,
      updatedAt: new Date(),
    });

    // Notify all admins in this franchise
    const admins = await prisma.user.findMany({
      where: {
        franchiseId,
        role: "ADMIN",
      },
      select: { id: true },
    });

    for (const admin of admins) {
      await emitNotification({
        title: "No Drivers Available",
        message: `Trip ${tripId} could not be assigned after ${attemptCount} attempts. Please assign manually.`,
        type: "error",
        userId: admin.id,
        franchiseId,
        metadata: {
          tripId,
          attemptCount,
          reason: "exhausted_driver_attempts",
        },
      });
    }

    // Log structured data for reporting
    logger.error("Trip unassignable - no drivers available", {
      tripId,
      franchiseId,
      attemptCount,
      timestamp: new Date().toISOString(),
      action: "exhausted_driver_attempts",
    });

    // Clean up dispatch state
    this.clearTripTimers(tripId);
  }

  private async listCandidateDrivers(franchiseId: string) {
    // NOTE: Kept as a separate method for reuse, but eligibility checks are intentionally minimal.
    return prisma.driver.findMany({
      where: {
        franchiseId,
      },
      select: {
        id: true,
        currentRating: true,
      },
    });
  }

  /**
   * Returns all drivers in a franchise ordered by rating tier priority:
   * 5 → 4 → 3 → 2 → 1 → unknown.
   *
   * No other eligibility checks are applied (as requested).
   */
  private async listCandidateDriverIdsByRatingTiers(franchiseId: string): Promise<string[]> {
    const drivers = await this.listCandidateDrivers(franchiseId);

    // Group by integer rating tier.
    const byTier = new Map<number, string[]>();
    for (const d of drivers) {
      const tier = this.getDriverRatingTier(d.currentRating);
      const arr = byTier.get(tier) ?? [];
      arr.push(d.id);
      byTier.set(tier, arr);
    }

    // Flatten tiers in requested order; unknown goes last.
    const ordered: string[] = [];
    for (const tier of DISPATCH_RATING_TIERS) {
      const ids = byTier.get(tier);
      if (ids?.length) ordered.push(...ids);
    }
    const unknownIds = byTier.get(DISPATCH_RATING.UNKNOWN_TIER);
    if (unknownIds?.length) ordered.push(...unknownIds);

    return ordered;
  }

  private async offerTripToDriver(
    tripId: string,
    driverId: string,
    options: OfferTripOptions = {}
  ): Promise<boolean> {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return false;
    if (trip.driverId) return false; // assigned, stop offering

    const now = new Date();
    const expiresAt = new Date(now.getTime() + DISPATCH_CONFIG.OFFER_TTL_MS);

    // Prevent duplicate offers to the same driver for the same trip,
    // BUT allow "re-request" if the previous offer is expired/cancelled/rejected.
    const existing = await prisma.tripOffer.findFirst({
      where: { tripId, driverId },
      select: { id: true, status: true, expiresAt: true },
    });
    if (existing) {
      const isExpiredByTime = existing.expiresAt.getTime() <= now.getTime();
      const isTerminalStatus = existing.status !== TripOfferStatus.OFFERED && existing.status !== TripOfferStatus.ACCEPTED;
      const isActiveOffer = existing.status === TripOfferStatus.OFFERED && !isExpiredByTime;
      const canReOffer = isExpiredByTime || isTerminalStatus || (options.forceResend === true && isActiveOffer);

      if (!canReOffer) return false;

      const offer = await prisma.tripOffer.update({
        where: { id: existing.id },
        data: {
          status: TripOfferStatus.OFFERED,
          offeredAt: now,
          expiresAt,
          acceptedAt: null,
          rejectedAt: null,
        },
      });

      socketService.emitTripOffer(driverId, {
        offerId: offer.id,
        trip: {
          id: trip.id,
          customerName: trip.customerName,
          customerPhone: trip.customerPhone,
          pickupAddress: trip.pickupAddress,
          dropAddress: trip.dropAddress,
          pickupLocation: trip.pickupLocation,
          dropLocation: trip.dropLocation,
          scheduledAt: trip.scheduledAt,
          pickupLat: trip.pickupLat,
          pickupLng: trip.pickupLng,
        },
        expiresAt: expiresAt.toISOString(),
      });

      return true;
    }

    const offer = await prisma.tripOffer.create({
      data: {
        tripId,
        driverId,
        expiresAt,
        status: TripOfferStatus.OFFERED,
      },
    });

    socketService.emitTripOffer(driverId, {
      offerId: offer.id,
      trip: {
        id: trip.id,
        customerName: trip.customerName,
        customerPhone: trip.customerPhone,
        pickupAddress: trip.pickupAddress,
        dropAddress: trip.dropAddress,
        pickupLocation: trip.pickupLocation,
        dropLocation: trip.dropLocation,
        scheduledAt: trip.scheduledAt,
        pickupLat: trip.pickupLat,
        pickupLng: trip.pickupLng,
      },
      expiresAt: expiresAt.toISOString(),
    });

    return true;
  }

  private async finalizeAssignment(tripId: string): Promise<void> {
    try {
      const trip = await prisma.trip.findUnique({ where: { id: tripId } });
      if (!trip) return;
      if (trip.driverId) return;

      const accepted = await prisma.tripOffer.findMany({
        where: { tripId, status: TripOfferStatus.ACCEPTED },
        include: { Driver: true },
      });

      if (accepted.length === 0) return;

      const winner = await this.pickWinner(trip, accepted);

      // Atomic-ish: update trip first; if already assigned by another worker, bail.
      const updatedTrip = await prisma.trip.updateMany({
        where: { id: tripId, driverId: null },
        data: { driverId: winner.driverId, status: TripStatus.ASSIGNED, updatedAt: new Date() },
      });
      if (updatedTrip.count === 0) return;

      await updateDriverTripStatus(winner.driverId, "ON_TRIP");

      // Cancel other offers (including other ACCEPTED).
      const losingOffers = accepted.filter((o) => o.id !== winner.offerId);
      await prisma.tripOffer.updateMany({
        where: {
          tripId,
          id: { not: winner.offerId },
          status: { in: [TripOfferStatus.OFFERED, TripOfferStatus.ACCEPTED] },
        },
        data: { status: TripOfferStatus.CANCELLED },
      });

      // Emit winner + losers
      socketService.emitTripAssigned(winner.driverId, { tripId });
      for (const lo of losingOffers) {
        socketService.emitTripOfferCancelled(lo.driverId, {
          offerId: lo.id,
          result: "lost",
          reason: "assigned_to_other",
        });
      }

      // Ensure trip is visible in mobile upcoming trips
      await updateTrip(tripId, { status: "ASSIGNED" });
    } finally {
      this.clearTripTimers(tripId);
    }
  }

  private async pickWinner(
    trip: { pickupLat: number | null; pickupLng: number | null },
    acceptedOffers: Array<{
      id: string;
      driverId: string;
      acceptedAt: Date | null;
      Driver: { currentLat: number | null; currentLng: number | null; currentRating: number | null };
    }>
  ): Promise<{ offerId: string; driverId: string }> {
    const pickupLat = trip.pickupLat;
    const pickupLng = trip.pickupLng;

    if (pickupLat == null || pickupLng == null) {
      // No coordinates; choose by rating (desc) then earliest accept time.
      const sorted = [...acceptedOffers].sort((a, b) => {
        const ar = a.Driver.currentRating ?? -1;
        const br = b.Driver.currentRating ?? -1;
        if (br !== ar) return br - ar;
        const at = a.acceptedAt?.getTime() ?? Number.POSITIVE_INFINITY;
        const bt = b.acceptedAt?.getTime() ?? Number.POSITIVE_INFINITY;
        return at - bt;
      });
      const winner = sorted[0];
      return { offerId: winner.id, driverId: winner.driverId };
    }

    /**
     * Winner selection strategy:
     * 1) Closest to pickup (if driver location available)
     * 2) If distance unknown for all, fall back to rating (desc)
     * 3) If still tied, earliest accept time
     */
    const ranked = acceptedOffers
      .map((offer) => {
        const lat = offer.Driver.currentLat;
        const lng = offer.Driver.currentLng;
        const distanceKm =
          lat == null || lng == null ? Number.POSITIVE_INFINITY : haversineDistanceKm({ lat, lng }, { lat: pickupLat, lng: pickupLng });
        return {
          offer,
          distanceKm,
          rating: offer.Driver.currentRating ?? -1,
          acceptedAtMs: offer.acceptedAt?.getTime() ?? Number.POSITIVE_INFINITY,
        };
      })
      .sort((a, b) => {
        if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a.acceptedAtMs - b.acceptedAtMs;
      });

    const best = ranked[0]?.offer;
    if (!best) return { offerId: acceptedOffers[0].id, driverId: acceptedOffers[0].driverId };
    return { offerId: best.id, driverId: best.driverId };
  }

  private clearTripTimers(tripId: string) {
    const timers = this.offerTimers.get(tripId) ?? [];
    for (const t of timers) clearTimeout(t);
    this.offerTimers.delete(tripId);

    const decision = this.decisionTimers.get(tripId);
    if (decision) clearTimeout(decision);
    this.decisionTimers.delete(tripId);

    this.dispatchStates.delete(tripId);
  }
}

export const tripDispatchService = new TripDispatchService();

