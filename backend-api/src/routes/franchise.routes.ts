// src/routes/franchise.routes.ts
import express from "express";
import {
  getFranchises,
  getFranchiseById,
  createFranchiseHandler,
  updateFranchiseHandler,
  softDeleteFranchiseHandler,
  updateFranchiseStatusHandler,
  getStaffByFranchiseIdHandler,
  getDriversByFranchiseIdHandler,
} from "../controllers/franchise.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { validate, validateParams, validateQuery } from "../middlewares/validation";
import { createFranchiseSchema, updateFranchiseSchema, updateFranchiseStatusSchema, paginationQuerySchema } from "../types/franchise.dto";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const router = express.Router();

// All franchise routes require authentication
router.use(authMiddleware);

// GET /franchises (with optional pagination)
router.get("/", validateQuery(paginationQuerySchema), getFranchises);
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid franchise ID format") })),
  getFranchiseById
);

// POST /franchises - Create new franchise (only ADMIN can create)
router.post(
  "/",
  requireRole(UserRole.ADMIN),
  validate(createFranchiseSchema),
  createFranchiseHandler
);

// PUT /franchises/:id - Update franchise (ADMIN and MANAGER can update)
router.put(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ id: z.string().uuid("Invalid franchise ID format") })),
  validate(updateFranchiseSchema),
  updateFranchiseHandler
);

// DELETE /franchises/:id - Soft delete franchise (only ADMIN)
router.delete(
  "/:id",
  requireRole(UserRole.ADMIN),
  validateParams(z.object({ id: z.string().uuid("Invalid franchise ID format") })),
  softDeleteFranchiseHandler
);

// PATCH /franchises/:id/status - Update franchise status (only ADMIN)
router.patch(
  "/:id/status",
  requireRole(UserRole.ADMIN),
  validateParams(z.object({ id: z.string().uuid("Invalid franchise ID format") })),
  validate(updateFranchiseStatusSchema),
  updateFranchiseStatusHandler
);

// GET /franchises/:id/staff - Get staff by franchise ID
router.get(
  "/:id/staff",
  validateParams(z.object({ id: z.string().uuid("Invalid franchise ID format") })),
  getStaffByFranchiseIdHandler
);

// GET /franchises/:id/drivers - Get drivers by franchise ID
router.get(
  "/:id/drivers",
  validateParams(z.object({ id: z.string().uuid("Invalid franchise ID format") })),
  getDriversByFranchiseIdHandler
);

export default router;
