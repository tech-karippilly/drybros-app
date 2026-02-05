import express from "express";
import { validate, validateParams } from "../middlewares/validation";
import { createTripReviewSchema, createReviewLinkSchema, submitReviewWithTokenSchema } from "../types/review.dto";
import { createTripReviewPublicHandler, getTripReviewByIdHandler, createReviewLinkHandler, submitReviewWithTokenHandler } from "../controllers/review.controller";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post("/public", validate(createTripReviewSchema), createTripReviewPublicHandler);

router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid review ID format") })),
  getTripReviewByIdHandler
);

// Create review link (Manager/Staff only)
router.post(
  "/link/create",
  authMiddleware,
  requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICE_STAFF]),
  validate(createReviewLinkSchema),
  createReviewLinkHandler
);

// Submit review via token (Public endpoint)
router.post(
  "/submit",
  validate(submitReviewWithTokenSchema),
  submitReviewWithTokenHandler
);

export default router;
