import express from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { UserRole } from "@prisma/client";
import {
  createStaffSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
  listStaffQuerySchema,
} from "../types/staff.dto";
import {
  createStaffHandler,
  listStaffHandler,
  getStaffByIdHandler,
  updateStaffHandler,
  updateStaffStatusHandler,
  getMyProfileHandler,
} from "../controllers/staff-clean.controller";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// POST /api/staff - Create Staff
// Access: ADMIN, MANAGER
// ============================================
router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(createStaffSchema),
  createStaffHandler
);

// ============================================
// GET /api/staff - List Staff
// Access: ADMIN, MANAGER (franchise-isolated)
// ============================================
router.get(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  listStaffHandler
);

// ============================================
// GET /api/staff/me - Get My Profile
// Access: STAFF only
// Note: This route must come before /:id to avoid route conflict
// ============================================
router.get(
  "/me",
  // requireRole for STAFF would be added here
  getMyProfileHandler
);

// ============================================
// GET /api/staff/:id - Get Staff by ID
// Access: ADMIN, MANAGER (franchise-validated)
// ============================================
router.get(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  getStaffByIdHandler
);

// ============================================
// PATCH /api/staff/:id - Update Staff
// Access: ADMIN, MANAGER
// ============================================
router.patch(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(updateStaffSchema),
  updateStaffHandler
);

// ============================================
// PATCH /api/staff/:id/status - Update Staff Status
// Access: ADMIN, MANAGER
// ============================================
router.patch(
  "/:id/status",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(updateStaffStatusSchema),
  updateStaffStatusHandler
);

export default router;
