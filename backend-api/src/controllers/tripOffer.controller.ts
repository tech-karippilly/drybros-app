import { Request, Response, NextFunction } from "express";
import { validateAndGetUUID } from "../utils/validation";
import { acceptTripOffer, listPendingOffersForDriver } from "../repositories/tripOffer.repository";
import { tripDispatchService } from "../services/tripDispatch.service";

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
    }

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

