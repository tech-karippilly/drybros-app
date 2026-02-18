import express from "express";
import { authMiddleware } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  submitTripReviewSchema,
  submitDriverRatingSchema,
} from "../types/review.dto";
import {
  submitTripReviewHandler,
  submitDriverRatingHandler,
} from "../controllers/review.controller";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// POST /api/reviews - Submit Trip Review
// Access: CUSTOMER only (authenticated via JWT)
// ============================================
router.post(
  "/",
  validate(submitTripReviewSchema),
  submitTripReviewHandler
);

export default router;
