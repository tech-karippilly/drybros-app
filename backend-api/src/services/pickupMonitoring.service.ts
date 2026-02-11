// src/services/pickupMonitoring.service.ts
import prisma from "../config/prismaClient";
import { TripStatus } from "@prisma/client";
import { tripDispatchService } from "./tripDispatch.service";
import { emitNotification } from "./notification.service";
import { haversineDistanceKm } from "../utils/geo";
import logger from "../config/logger";
import { PICKUP_MONITORING_CONFIG } from "../constants/dispatch";

/**
 * Background service that monitors accepted trips to ensure drivers
 * are making progress toward pickup location.
 * 
 * This prevents trips from getting stuck when:
 * - Driver accepts but doesn't move toward pickup
 * - Driver goes offline/inactive after accepting
 * - Driver moves away from pickup location
 * 
 * Design:
 * - Runs every 60 seconds (PICKUP_CHECK_INTERVAL_MS)
 * - Monitors trips with status ASSIGNED or DRIVER_ACCEPTED
 * - Checks if driver location is stale or not approaching pickup
 * - Auto-reassigns trip if driver hasn't made progress after timeout
 */
class PickupMonitoringService {
  private intervalHandle: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the background worker
   */
  start(): void {
    if (this.intervalHandle) {
      logger.warn("PickupMonitoringService already started");
      return;
    }

    logger.info("Starting PickupMonitoringService", {
      checkIntervalMs: PICKUP_MONITORING_CONFIG.PICKUP_CHECK_INTERVAL_MS,
      noProgressTimeoutMs: PICKUP_MONITORING_CONFIG.NO_PROGRESS_TIMEOUT_MS,
      staleLocationThresholdMs: PICKUP_MONITORING_CONFIG.STALE_LOCATION_THRESHOLD_MS,
    });

    // Run immediately on start
    this.checkStuckTrips().catch((err) => {
      logger.error("Initial pickup monitoring check failed", { error: err });
    });

    // Then run periodically
    this.intervalHandle = setInterval(() => {
      if (!this.isRunning) {
        this.checkStuckTrips().catch((err) => {
          logger.error("Periodic pickup monitoring check failed", { error: err });
        });
      }
    }, PICKUP_MONITORING_CONFIG.PICKUP_CHECK_INTERVAL_MS);
  }

  /**
   * Stop the background worker
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      logger.info("PickupMonitoringService stopped");
    }
  }

  /**
   * Main worker logic: find trips where driver accepted but hasn't made progress
   */
  private async checkStuckTrips(): Promise<void> {
    if (this.isRunning) return; // Prevent concurrent runs
    this.isRunning = true;

    try {
      const now = new Date();
      const timeoutThreshold = new Date(
        now.getTime() - PICKUP_MONITORING_CONFIG.NO_PROGRESS_TIMEOUT_MS
      );

      // Find trips that are:
      // 1. Status: ASSIGNED or DRIVER_ACCEPTED (post-accept, pre-pickup)
      // 2. Have a driver assigned
      // 3. updatedAt older than timeout threshold (no progress for X minutes)
      const stuckTrips = await prisma.trip.findMany({
        where: {
          status: {
            in: [TripStatus.ASSIGNED, TripStatus.DRIVER_ACCEPTED],
          },
          driverId: { not: null },
          updatedAt: { lt: timeoutThreshold },
        },
        include: {
          Driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              driverCode: true,
              currentLat: true,
              currentLng: true,
              locationUpdatedAt: true,
            },
          },
        },
        take: 20, // Process in batches
      });

      if (stuckTrips.length === 0) {
        logger.debug("No stuck trips found");
        return;
      }

      logger.info("Found potentially stuck trips", {
        count: stuckTrips.length,
        tripIds: stuckTrips.map((t) => t.id),
      });

      // Process each stuck trip
      for (const trip of stuckTrips) {
        try {
          await this.handleStuckTrip(trip);
        } catch (err) {
          logger.error("Failed to handle stuck trip", {
            tripId: trip.id,
            driverId: trip.driverId,
            error: err instanceof Error ? err.message : String(err),
          });
          // Continue processing other trips
        }
      }

      logger.info("Completed processing stuck trips", {
        processedCount: stuckTrips.length,
      });
    } catch (err) {
      logger.error("Pickup monitoring check failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Handle a single stuck trip:
   * 1. Validate driver location is stale or not moving toward pickup
   * 2. Trigger auto-reassignment
   * 3. Notify driver and admin
   */
  private async handleStuckTrip(trip: any): Promise<void> {
    const { id: tripId, driverId, pickupLat, pickupLng, franchiseId, driver } = trip;

    if (!driver) {
      logger.warn("Stuck trip has no driver info, skipping", { tripId });
      return;
    }

    const now = new Date();
    const driverLocation = driver.locationUpdatedAt
      ? new Date(driver.locationUpdatedAt)
      : null;

    // Check 1: Is driver location stale?
    const locationIsStale =
      !driverLocation ||
      now.getTime() - driverLocation.getTime() >
        PICKUP_MONITORING_CONFIG.STALE_LOCATION_THRESHOLD_MS;

    if (locationIsStale) {
      logger.warn("Driver location is stale, reassigning trip", {
        tripId,
        driverId,
        lastLocationUpdate: driverLocation?.toISOString() ?? "never",
        staleThresholdMs: PICKUP_MONITORING_CONFIG.STALE_LOCATION_THRESHOLD_MS,
      });

      await this.reassignStuckTrip(trip, "stale_driver_location");
      return;
    }

    // Check 2: Is driver moving toward pickup?
    if (pickupLat && pickupLng && driver.currentLat && driver.currentLng) {
      const distanceKm = haversineDistanceKm(
        { lat: driver.currentLat, lng: driver.currentLng },
        { lat: pickupLat, lng: pickupLng }
      );

      // If driver is very far from pickup (> 50km), likely not making progress
      if (distanceKm > PICKUP_MONITORING_CONFIG.MAX_PICKUP_DISTANCE_KM) {
        logger.warn("Driver too far from pickup location, reassigning trip", {
          tripId,
          driverId,
          distanceKm,
          maxDistanceKm: PICKUP_MONITORING_CONFIG.MAX_PICKUP_DISTANCE_KM,
        });

        await this.reassignStuckTrip(trip, "driver_too_far_from_pickup");
        return;
      }
    }

    // If we reach here, trip might be okay but just slow progress
    // Log but don't reassign yet
    logger.info("Trip appears stuck but driver location valid, monitoring", {
      tripId,
      driverId,
      distanceToPickup: pickupLat && pickupLng && driver.currentLat && driver.currentLng
        ? haversineDistanceKm(
            { lat: driver.currentLat, lng: driver.currentLng },
            { lat: pickupLat, lng: pickupLng }
          )
        : null,
    });
  }

  /**
   * Reassign a stuck trip to another driver
   */
  private async reassignStuckTrip(trip: any, reason: string): Promise<void> {
    const { id: tripId, driverId, franchiseId, driver } = trip;

    logger.info("Reassigning stuck trip", {
      tripId,
      driverId,
      reason,
    });

    // Reset trip to NOT_ASSIGNED and clear driver
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.NOT_ASSIGNED,
        driverId: null,
        updatedAt: new Date(),
      },
    });

    // Reset driver to AVAILABLE
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        driverTripStatus: "AVAILABLE",
      },
    });

    // Cancel any active offers for this trip
    await prisma.tripOffer.updateMany({
      where: {
        tripId,
        status: { in: ["OFFERED", "ACCEPTED"] },
      },
      data: {
        status: "CANCELLED",
      },
    });

    // Notify driver that trip was reassigned
    await emitNotification({
      title: "Trip Reassigned",
      message: `Trip ${tripId} was reassigned due to no pickup progress. Please contact support if this was an error.`,
      type: "warning",
      driverId,
      franchiseId,
      metadata: {
        tripId,
        reason,
        action: "auto_reassignment",
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: {
        franchiseId,
        role: "ADMIN",
      },
      select: { id: true },
    });

    for (const admin of admins) {
      await emitNotification({
        title: "Trip Auto-Reassigned",
        message: `Trip ${tripId} was auto-reassigned from driver ${driver?.driverCode || driverId} due to ${reason.replace(/_/g, " ")}.`,
        type: "warning",
        userId: admin.id,
        franchiseId,
        metadata: {
          tripId,
          driverId,
          reason,
          action: "auto_reassignment",
        },
      });
    }

    // Trigger dispatch to find new driver
    await tripDispatchService.startDispatchForTrip(tripId);

    logger.info("Stuck trip reassigned and dispatched", {
      tripId,
      previousDriverId: driverId,
      reason,
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
export const pickupMonitoringService = new PickupMonitoringService();
