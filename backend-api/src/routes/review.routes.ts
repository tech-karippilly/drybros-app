import express from "express";
import { validate, validateParams } from "../middlewares/validation";
import { createTripReviewSchema } from "../types/review.dto";
import { createTripReviewPublicHandler, getTripReviewByIdHandler } from "../controllers/review.controller";
import { z } from "zod";

const router = express.Router();

router.post("/public", validate(createTripReviewSchema), createTripReviewPublicHandler);

router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid review ID format") })),
  getTripReviewByIdHandler
);

export default router;
