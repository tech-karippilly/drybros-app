// src/routes/distance.routes.ts
import express from "express";
import { calculateDistanceHandler } from "../controllers/distance.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateQuery } from "../middlewares/validation";
import { z } from "zod";

const router = express.Router();

// Require authentication for distance calculations
router.use(authMiddleware);

// GET /distance/calculate?lat1=12.34&lng1=56.78&lat2=12.35&lng2=56.79
router.get(
  "/calculate",
  validateQuery(
    z.object({
      lat1: z.string().regex(/^-?\d+(\.\d+)?$/, "lat1 must be a valid number"),
      lng1: z.string().regex(/^-?\d+(\.\d+)?$/, "lng1 must be a valid number"),
      lat2: z.string().regex(/^-?\d+(\.\d+)?$/, "lat2 must be a valid number"),
      lng2: z.string().regex(/^-?\d+(\.\d+)?$/, "lng2 must be a valid number"),
    })
  ),
  calculateDistanceHandler
);

export default router;
