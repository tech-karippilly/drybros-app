import express from "express";
import { authMiddleware } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  submitDriverRatingSchema,
} from "../types/review.dto";
import {
  submitDriverRatingHandler,
} from "../controllers/review.controller";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// POST /api/ratings - Submit Driver Rating
// Access: CUSTOMER only (authenticated via JWT)
// ============================================
router.post(
  "/",
  validate(submitDriverRatingSchema),
  submitDriverRatingHandler
);

export default router;
