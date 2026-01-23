// src/routes/complaint.routes.ts
import express from "express";
import {
  createComplaintHandler,
  getComplaintsHandler,
  getComplaintByIdHandler,
  updateComplaintStatusHandler,
} from "../controllers/complaint.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, validateQuery, validateParams } from "../middlewares/validation";
import { createComplaintSchema, updateComplaintStatusSchema, complaintPaginationQuerySchema } from "../types/complaint.dto";
import { z } from "zod";

const router = express.Router();

// All complaint routes require authentication
router.use(authMiddleware);

// GET /complaints (with optional pagination and filters)
router.get("/", validateQuery(complaintPaginationQuerySchema), getComplaintsHandler);

// GET /complaints/:id
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid complaint ID format") })),
  getComplaintByIdHandler
);

// POST /complaints
router.post("/", validate(createComplaintSchema), createComplaintHandler);

// PATCH /complaints/:id/status
router.patch(
  "/:id/status",
  validateParams(z.object({ id: z.string().uuid("Invalid complaint ID format") })),
  validate(updateComplaintStatusSchema),
  updateComplaintStatusHandler
);

export default router;
