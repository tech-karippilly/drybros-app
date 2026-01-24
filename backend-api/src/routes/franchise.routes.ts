// src/routes/franchise.routes.ts
import express from "express";
import {
  getFranchises,
  getFranchiseById,
  createFranchiseHandler,
  updateFranchiseHandler,
  softDeleteFranchiseHandler,
  updateFranchiseStatusHandler,
  getFranchisePersonnelHandler,
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

// GET /franchises/:id/personnel - Get staff, drivers, and manager by franchise ID (combined)
router.get(
  "/:id/personnel",
  validateParams(z.object({ id: z.string().uuid("Invalid franchise ID format") })),
  getFranchisePersonnelHandler
);

export default router;
