import express from "express";
import { authMiddleware } from "../middlewares/auth";
import { validateParams } from "../middlewares/validation";
import { z } from "zod";
import { acceptTripOfferHandler, listMyPendingTripOffersHandler } from "../controllers/tripOffer.controller";

const router = express.Router();

// Driver token required
router.use(authMiddleware);

router.get("/my-pending", listMyPendingTripOffersHandler);
router.post(
  "/:id/accept",
  validateParams(z.object({ id: z.string().uuid("Invalid offer ID format") })),
  acceptTripOfferHandler
);

export default router;

