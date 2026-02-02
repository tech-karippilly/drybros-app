import { Request, Response, NextFunction } from "express";
import { validateAndGetUUID } from "../utils/validation";
import { acceptTripOffer, listPendingOffersForDriver, updateTripOfferStatus, getTripOfferById } from "../repositories/tripOffer.repository";
import { tripDispatchService } from "../services/tripDispatch.service";
import { TripOfferStatus, ActivityAction, ActivityEntityType } from "@prisma/client";
import { logActivity } from "../services/activity.service";

/**
 * GET /trip-offers/my-pending
 * Returns active (not expired) offers for the authenticated driver.
 */
export async function listMyPendingTripOffersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const driverId = req.driver?.driverId;
    if (!driverId) {
      return res.status(401).json({ error: "Driver authentication required" });
    }

    const offers = await listPendingOffersForDriver(driverId);
    res.json({ data: offers });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /trip-offers/:id/accept
 * Driver accepts the offer (idempotent).
 */
export async function acceptTripOfferHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const driverId = req.driver?.driverId;
    if (!driverId) {
      return res.status(401).json({ error: "Driver authentication required" });
    }

    const offerId = validateAndGetUUID(req.params.id, "Offer ID");
    const updated = await acceptTripOffer(offerId, driverId);

    if (!updated) {
      return res.status(404).json({ error: "Offer not found" });
    }

    if (updated.status === "ACCEPTED") {
      tripDispatchService.notifyOfferAccepted(updated.tripId).catch(() => {});

      // Log activity for driver alerts (non-blocking)
      logActivity({
        action: ActivityAction.TRIP_ACCEPTED,
        entityType: ActivityEntityType.TRIP,
        entityId: updated.tripId,
        driverId,
        tripId: updated.tripId,
        description: `Driver accepted trip offer ${offerId} for trip ${updated.tripId}`,
        metadata: { offerId, tripId: updated.tripId },
      }).catch(() => {});
    }

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /trip-offers/:id/reject
 * Driver rejects the offer (idempotent-ish).
 */
export async function rejectTripOfferHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const driverId = req.driver?.driverId;
    if (!driverId) {
      return res.status(401).json({ error: "Driver authentication required" });
    }

    const offerId = validateAndGetUUID(req.params.id, "Offer ID");
    const existing = await getTripOfferById(offerId);
    if (!existing || existing.driverId !== driverId) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // If already terminal (rejected/expired/cancelled), return as-is for idempotency.
    if (existing.status !== TripOfferStatus.OFFERED) {
      return res.json({ data: existing });
    }

    const updated = await updateTripOfferStatus(offerId, TripOfferStatus.REJECTED);

    // Log activity for driver alerts (non-blocking)
    logActivity({
      action: ActivityAction.TRIP_REJECTED,
      entityType: ActivityEntityType.TRIP,
      entityId: updated.tripId,
      driverId,
      tripId: updated.tripId,
      description: `Driver rejected trip offer ${offerId} for trip ${updated.tripId}`,
      metadata: { offerId, tripId: updated.tripId },
    }).catch(() => {});

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

