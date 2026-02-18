import express from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";
import {
  enforceTripFranchiseScope,
  validateTripFranchiseAccess,
} from "../middlewares/tripFranchiseScope";
import { validate } from "../middlewares/validation";
import {
  createTripSchema,
  assignDriverSchema,
  reassignDriverSchema,
  rescheduleTripSchema,
  cancelTripSchema,
  startTripSchema,
  endTripSchema,
  collectPaymentSchema,
} from "../types/trip.dto";
import {
  createTripHandler,
  getTripsHandler,
  getTripByIdHandler,
  assignDriverHandler,
  reassignDriverHandler,
  rescheduleTripHandler,
  cancelTripHandler,
  startTripHandler,
  endTripHandler,
  collectPaymentHandler,
} from "../controllers/trip.controller";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// POST /api/trips - Create Trip
// Access: ADMIN, MANAGER, OFFICE_STAFF
// ============================================
router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICE_STAFF),
  validate(createTripSchema),
  createTripHandler
);

// ============================================
// GET /api/trips - List Trips
// Access: ADMIN, MANAGER, OFFICE_STAFF, DRIVER (own only)
// Middleware enforces franchise scope for MANAGER/OFFICE_STAFF
// ============================================
router.get(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICE_STAFF, UserRole.DRIVER),
  enforceTripFranchiseScope,
  getTripsHandler
);

// ============================================
// GET /api/trips/:id - Get Trip by ID
// Access: ADMIN, MANAGER, OFFICE_STAFF, DRIVER (own only)
// ============================================
router.get(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICE_STAFF, UserRole.DRIVER),
  validateTripFranchiseAccess,
  getTripByIdHandler
);

// ============================================
// POST /api/trips/:id/assign - Assign Driver
// Access: ADMIN, MANAGER, OFFICE_STAFF
// ============================================
router.post(
  "/:id/assign",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICE_STAFF),
  validateTripFranchiseAccess,
  validate(assignDriverSchema),
  assignDriverHandler
);

// ============================================
// POST /api/trips/:id/reassign - Reassign Driver
// Access: ADMIN, MANAGER
// ============================================
router.post(
  "/:id/reassign",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateTripFranchiseAccess,
  validate(reassignDriverSchema),
  reassignDriverHandler
);

// ============================================
// POST /api/trips/:id/reschedule - Reschedule Trip
// Access: ADMIN, MANAGER
// ============================================
router.post(
  "/:id/reschedule",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateTripFranchiseAccess,
  validate(rescheduleTripSchema),
  rescheduleTripHandler
);

// ============================================
// POST /api/trips/:id/cancel - Cancel Trip
// Access: ADMIN, MANAGER, OFFICE_STAFF
// ============================================
router.post(
  "/:id/cancel",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICE_STAFF),
  validateTripFranchiseAccess,
  validate(cancelTripSchema),
  cancelTripHandler
);

// ============================================
// POST /api/trips/:id/start - Start Trip
// Access: DRIVER only
// ============================================
router.post(
  "/:id/start",
  requireRole(UserRole.DRIVER),
  validate(startTripSchema),
  startTripHandler
);

// ============================================
// POST /api/trips/:id/end - End Trip
// Access: DRIVER only
// ============================================
router.post(
  "/:id/end",
  requireRole(UserRole.DRIVER),
  validate(endTripSchema),
  endTripHandler
);

// ============================================
// POST /api/trips/:id/payment - Collect Payment
// Access: DRIVER only
// ============================================
router.post(
  "/:id/payment",
  requireRole(UserRole.DRIVER),
  validate(collectPaymentSchema),
  collectPaymentHandler
);

export default router;
