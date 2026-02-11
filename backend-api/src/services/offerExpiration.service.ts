// src/services/offerExpiration.service.ts
import prisma from "../config/prismaClient";
import { TripOfferStatus } from "@prisma/client";
import { tripDispatchService } from "./tripDispatch.service";
import logger from "../config/logger";
import { DISPATCH_CONFIG } from "../constants/dispatch";

/**
 * Background service that periodically scans for expired TripOffers
 * and triggers automatic reassignment to the next available driver.
 * 
 * This ensures trips don't get stuck when drivers don't respond to offers.
 * 
 * Design:
 * - Runs every 30 seconds (EXPIRATION_CHECK_INTERVAL_MS)
 * - Finds offers where: status=OFFERED, expiresAt < now, trip still unassigned
 * - Marks expired offers as EXPIRED
 * - Triggers reassignment via TripDispatchService
 * - Idempotent: safe to run multiple times, handles race conditions
 */
class OfferExpirationService {
  private intervalHandle: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the background worker
   */
  start(): void {
    if (this.intervalHandle) {
      logger.warn("OfferExpirationService already started");
      return;
    }

    logger.info("Starting OfferExpirationService", {
      checkIntervalMs: DISPATCH_CONFIG.EXPIRATION_CHECK_INTERVAL_MS,
      offerTtlMs: DISPATCH_CONFIG.OFFER_TTL_MS,
    });

    // Run immediately on start
    this.checkExpiredOffers().catch((err) => {
      logger.error("Initial offer expiration check failed", { error: err });
    });

    // Then run periodically
    this.intervalHandle = setInterval(() => {
      if (!this.isRunning) {
        this.checkExpiredOffers().catch((err) => {
          logger.error("Periodic offer expiration check failed", { error: err });
        });
      }
    }, DISPATCH_CONFIG.EXPIRATION_CHECK_INTERVAL_MS);
  }

  /**
   * Stop the background worker
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      logger.info("OfferExpirationService stopped");
    }
  }

  /**
   * Main worker logic: find expired offers and trigger reassignment
   */
  private async checkExpiredOffers(): Promise<void> {
    if (this.isRunning) return; // Prevent concurrent runs
    this.isRunning = true;

    try {
      const now = new Date();
      
      // Find all expired offers where:
      // 1. Status is OFFERED (not accepted/rejected/expired yet)
      // 2. expiresAt < now
      // 3. Trip is still unassigned (driverId is null)
      const expiredOffers = await prisma.tripOffer.findMany({
        where: {
          status: TripOfferStatus.OFFERED,
          expiresAt: { lt: now },
          Trip: {
            driverId: null, // Trip still unassigned
          },
        },
        include: {
          Trip: {
            select: {
              id: true,
              driverId: true,
              status: true,
              franchiseId: true,
            },
          },
        },
        take: 50, // Process in batches to avoid overwhelming the system
      });

      if (expiredOffers.length === 0) {
        logger.debug("No expired offers found");
        return;
      }

      logger.info("Processing expired offers", {
        count: expiredOffers.length,
        offerIds: expiredOffers.map((o) => o.id),
      });

      // Process each expired offer
      for (const offer of expiredOffers) {
        try {
          await this.handleExpiredOffer(offer);
        } catch (err) {
          logger.error("Failed to handle expired offer", {
            offerId: offer.id,
            tripId: offer.tripId,
            driverId: offer.driverId,
            error: err instanceof Error ? err.message : String(err),
          });
          // Continue processing other offers
        }
      }

      logger.info("Completed processing expired offers", {
        processedCount: expiredOffers.length,
      });
    } catch (err) {
      logger.error("Offer expiration check failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Handle a single expired offer:
   * 1. Mark offer as EXPIRED
   * 2. Trigger reassignment to next driver
   */
  private async handleExpiredOffer(
    offer: {
      id: string;
      tripId: string;
      driverId: string;
      Trip: {
        id: string;
        driverId: string | null;
        status: string;
        franchiseId: string;
      };
    }
  ): Promise<void> {
    const { id: offerId, tripId, driverId, Trip: trip } = offer;

    // Double-check trip is still unassigned (race condition guard)
    if (trip.driverId !== null) {
      logger.debug("Trip already assigned, skipping expired offer", {
        offerId,
        tripId,
        assignedDriverId: trip.driverId,
      });
      return;
    }

    logger.info("Handling expired offer", {
      offerId,
      tripId,
      expiredForDriverId: driverId,
    });

    // Mark offer as EXPIRED
    await prisma.tripOffer.update({
      where: { id: offerId },
      data: { status: TripOfferStatus.EXPIRED },
    });

    logger.info("Marked offer as EXPIRED", { offerId, tripId });

    // Trigger reassignment using existing dispatch logic
    // This will find the next eligible driver and send them an offer
    await tripDispatchService.handleExpiredOffer(tripId, driverId);

    logger.info("Triggered reassignment for expired offer", {
      offerId,
      tripId,
      expiredForDriverId: driverId,
    });
  }

  /**
   * Get service status for health checks
   */
  getStatus(): { isRunning: boolean; intervalActive: boolean } {
    return {
      isRunning: this.isRunning,
      intervalActive: this.intervalHandle !== null,
    };
  }
}

// Singleton instance
export const offerExpirationService = new OfferExpirationService();
