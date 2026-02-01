import prisma from "../config/prismaClient";
import { TripOfferStatus, TripStatus } from "@prisma/client";
import { DISPATCH_CONFIG } from "../constants/dispatch";
import { socketService } from "./socket.service";
import { haversineDistanceKm } from "../utils/geo";
import { updateDriverTripStatus } from "../repositories/driver.repository";
import { updateTrip } from "../repositories/trip.repository";

type DispatchState = {
  candidateDriverIds: string[];
  startedAt: Date;
};

class TripDispatchService {
  private dispatchStates = new Map<string, DispatchState>();
  private offerTimers = new Map<string, NodeJS.Timeout[]>();
  private decisionTimers = new Map<string, NodeJS.Timeout>();

  async startDispatchForTrip(tripId: string): Promise<void> {
    if (this.dispatchStates.has(tripId)) return;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return;
    if (trip.driverId) return; // already assigned

    const candidates = await this.listCandidateDrivers(trip.franchiseId);
    const candidateDriverIds = candidates.map((d) => d.id);

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

  private async listCandidateDrivers(franchiseId: string) {
    /**
     * Priority: rating desc, remainingDailyLimit desc, then freshest location.
     *
     * NOTE:
     * We intentionally do NOT require location to be present/recent for eligibility,
     * because we still want drivers to receive trip requests even if they haven't
     * updated GPS recently (e.g., app restarted, location permission pending).
     * Location is used later as a tie-breaker when picking a winner among accepted offers.
     */
    return prisma.driver.findMany({
      where: {
        franchiseId,
        isActive: true,
        status: "ACTIVE",
        bannedGlobally: false,
        blacklisted: false,
        driverTripStatus: "AVAILABLE",
        OR: [{ remainingDailyLimit: { gt: 0 } }, { remainingDailyLimit: null }],
      },
      orderBy: [
        { currentRating: "desc" },
        { remainingDailyLimit: "desc" },
        { locationUpdatedAt: "desc" },
      ],
      select: {
        id: true,
      },
    });
  }

  private async offerTripToDriver(tripId: string, driverId: string): Promise<void> {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return;
    if (trip.driverId) return; // assigned, stop offering

    const now = new Date();
    const expiresAt = new Date(now.getTime() + DISPATCH_CONFIG.OFFER_TTL_MS);

    // Prevent duplicate offers to the same driver for the same trip.
    const existing = await prisma.tripOffer.findFirst({
      where: { tripId, driverId },
      select: { id: true },
    });
    if (existing) return;

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

