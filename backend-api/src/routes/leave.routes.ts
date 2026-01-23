// src/routes/leave.routes.ts
import express from "express";
import {
  createLeaveRequestHandler,
  getLeaveRequestsHandler,
  getLeaveRequestByIdHandler,
  updateLeaveRequestStatusHandler,
} from "../controllers/leave.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, validateQuery, validateParams } from "../middlewares/validation";
import { createLeaveRequestSchema, updateLeaveRequestStatusSchema, leaveRequestPaginationQuerySchema } from "../types/leave.dto";
import { z } from "zod";

const router = express.Router();

// All leave routes require authentication
router.use(authMiddleware);

// GET /leave-requests (with optional pagination and filters)
router.get("/", validateQuery(leaveRequestPaginationQuerySchema), getLeaveRequestsHandler);

// GET /leave-requests/:id
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid leave request ID format") })),
  getLeaveRequestByIdHandler
);

// POST /leave-requests
router.post("/", validate(createLeaveRequestSchema), createLeaveRequestHandler);

// PATCH /leave-requests/:id/status
router.patch(
  "/:id/status",
  validateParams(z.object({ id: z.string().uuid("Invalid leave request ID format") })),
  validate(updateLeaveRequestStatusSchema),
  updateLeaveRequestStatusHandler
);

export default router;
