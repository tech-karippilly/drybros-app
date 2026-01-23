// src/routes/rating.routes.ts
import express from "express";
import {
  createRatingPublicHandler,
  createRatingHandler,
  getRatingsHandler,
  getRatingByIdHandler,
} from "../controllers/rating.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, validateQuery, validateParams } from "../middlewares/validation";
import { createDriverRatingSchema, ratingPaginationQuerySchema } from "../types/rating.dto";
import { z } from "zod";

const router = express.Router();

// Public route - no authentication required
router.post("/public", validate(createDriverRatingSchema), createRatingPublicHandler);

// Authenticated routes
router.use(authMiddleware);

// GET /ratings (with optional pagination and filters)
router.get("/", validateQuery(ratingPaginationQuerySchema), getRatingsHandler);

// GET /ratings/:id
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid rating ID format") })),
  getRatingByIdHandler
);

// POST /ratings (with authentication)
router.post("/", validate(createDriverRatingSchema), createRatingHandler);

export default router;
