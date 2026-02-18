// src/routes/franchise.routes.ts
import express from "express";
import {
  getFranchises,
  getFranchiseById,
  getMyFranchiseHandler,
  createFranchiseHandler,
  updateFranchiseHandler,
  updateFranchiseStatusHandler,
  deleteFranchiseHandler,
} from "../controllers/franchise.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { validate, validateParams, validateQuery } from "../middlewares/validation";
import {
  createFranchiseSchema,
  updateFranchiseSchema,
  updateFranchiseStatusSchema,
  listFranchisesQuerySchema,
} from "../types/franchise.dto";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const router = express.Router();

// All franchise routes require authentication
router.use(authMiddleware);

// GET /franchises - List all franchises (ADMIN only)
// Supports pagination, search by name, filter by status
router.get(
  "/",
  requireRole(UserRole.ADMIN),
  validateQuery(listFranchisesQuerySchema),
  getFranchises
);

// GET /franchises/my - Get own franchise (ADMIN, MANAGER, STAFF, OFFICE_STAFF, DRIVER)
// MUST be defined before /:id to avoid being matched as an ID parameter
router.get(
  "/my",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICE_STAFF, UserRole.DRIVER),
  getMyFranchiseHandler
);

// GET /franchises/:id - Get franchise by ID
// Access: ADMIN (any franchise), MANAGER/STAFF/DRIVER (own franchise only)
router.get(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICE_STAFF, UserRole.DRIVER),
  validateParams(z.object({ id: z.string().uuid("Invalid franchise ID format") })),
  getFranchiseById
);

// POST /franchises - Create new franchise (ADMIN only)
router.post(
  "/",
  requireRole(UserRole.ADMIN),
  validate(createFranchiseSchema),
  createFranchiseHandler
);

// PATCH /franchises/:id - Update franchise info (ADMIN only)
router.patch(
  "/:id",
  requireRole(UserRole.ADMIN),
  validateParams(z.object({ id: z.string().uuid("Invalid franchise ID format") })),
  validate(updateFranchiseSchema),
  updateFranchiseHandler
);

// PATCH /franchises/:id/status - Update franchise status (ADMIN only)
router.patch(
  "/:id/status",
  requireRole(UserRole.ADMIN),
  validateParams(z.object({ id: z.string().uuid("Invalid franchise ID format") })),
  validate(updateFranchiseStatusSchema),
  updateFranchiseStatusHandler
);

// DELETE /franchises/:id - Delete franchise and all related data (ADMIN only)
router.delete(
  "/:id",
  requireRole(UserRole.ADMIN),
  validateParams(z.object({ id: z.string().uuid("Invalid franchise ID format") })),
  deleteFranchiseHandler
);

export default router;
