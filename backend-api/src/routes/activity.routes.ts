// src/routes/activity.routes.ts
import express from "express";
import {
  getActivityLogsHandler,
  getActivityLogByIdHandler,
  getActivityLogsStreamHandler,
} from "../controllers/activity.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateQuery, validateParams } from "../middlewares/validation";
import { activityPaginationQuerySchema } from "../types/activity.dto";
import { z } from "zod";

const router = express.Router();

// All activity routes require authentication
router.use(authMiddleware);

// GET /activities (with optional pagination and filters)
router.get("/", validateQuery(activityPaginationQuerySchema), getActivityLogsHandler);

// GET /activities/stream - Server-Sent Events for realtime updates
router.get("/stream", getActivityLogsStreamHandler);

// GET /activities/:id
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid activity log ID format") })),
  getActivityLogByIdHandler
);

export default router;
