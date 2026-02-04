// src/routes/driver.routes.ts
import express from "express";
import { getDrivers, getDriverById, getDriverWithPerformanceHandler, getDriverPerformanceHandler, getAvailableGreenDriversHandler, getAvailableDriversHandler, getDriversByFranchisesHandler, createDriverHandler, loginDriverHandler, updateDriverHandler, updateDriverStatusHandler, softDeleteDriverHandler, submitCashToCompanyHandler, submitCashForSettlementHandler, getDriverDailyLimitHandler, updateMyDriverLocationHandler, getMyDriverProfileHandler, getDriversLiveLocationHandler } from "../controllers/driver.controller";
import { getDriverDailyStatsHandler, getDriverMonthlyStatsHandler, getDriverSettlementHandler } from "../controllers/driverEarnings.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";
import { validate, validateParams, validateQuery } from "../middlewares/validation";
import { createDriverSchema, driverLoginSchema, updateDriverSchema, updateDriverStatusSchema, paginationQuerySchema, submitCashForSettlementSchema } from "../types/driver.dto";
import { updateDriverLocationSchema } from "../types/driverLocation.dto";
import { z } from "zod";

const router = express.Router();

// Public route - Driver login (no authentication required)
router.post("/login", validate(driverLoginSchema), loginDriverHandler);

// All other driver routes require authentication
router.use(authMiddleware);

// GET /drivers/me/profile - Driver profile summary for mobile
router.get(
  "/me/profile",
  validateQuery(
    z.object({
      year: z.string().regex(/^\d{4}$/).optional(),
      month: z.string().regex(/^(?:[1-9]|1[0-2])$/).optional(),
    })
  ),
  getMyDriverProfileHandler
);

// POST /drivers/me/location - Driver live location updates (driver token required)
router.post("/me/location", validate(updateDriverLocationSchema), updateMyDriverLocationHandler);

// GET /drivers/live-location - View live locations (Admin, Manager, Staff)
router.get(
  "/live-location",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICE_STAFF),
  validateQuery(z.object({ franchiseId: z.string().uuid("Invalid franchise ID format").optional() })),
  getDriversLiveLocationHandler
);

// GET /drivers (with optional pagination and performance)
router.get("/", validateQuery(paginationQuerySchema), getDrivers);
router.get(
  "/available/green",
  validateQuery(z.object({ franchiseId: z.string().uuid("Invalid franchise ID format").optional() })),
  getAvailableGreenDriversHandler
);
router.get(
  "/available",
  validateQuery(z.object({ franchiseId: z.string().uuid("Invalid franchise ID format").optional() })),
  getAvailableDriversHandler
);
router.get(
  "/by-franchises",
  validateQuery(z.object({
    franchiseIds: z.union([
      z.string().uuid().array(),
      z.string().transform((val) => val.split(",").map((id) => id.trim())),
    ]).optional(),
    franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
  })),
  getDriversByFranchisesHandler
);
// Specific routes must come before parameterized routes
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  getDriverById
);
router.get(
  "/:id/with-performance",
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  getDriverWithPerformanceHandler
);
router.get(
  "/:id/performance",
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  getDriverPerformanceHandler
);
router.get(
  "/:id/daily-stats",
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  getDriverDailyStatsHandler
);
router.get(
  "/:id/monthly-stats",
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  getDriverMonthlyStatsHandler
);
router.get(
  "/:id/settlement",
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  getDriverSettlementHandler
);
router.get(
  "/:id/daily-limit",
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  getDriverDailyLimitHandler
);

// POST /drivers - Create new driver (ADMIN, OFFICE_STAFF, MANAGER, STAFF)
router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.MANAGER, UserRole.STAFF),
  validate(createDriverSchema),
  createDriverHandler
);

// PATCH /drivers/:id - Update driver (ADMIN, OFFICE_STAFF, MANAGER, STAFF)
router.patch(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.MANAGER, UserRole.STAFF),
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  validate(updateDriverSchema),
  updateDriverHandler
);

// PATCH /drivers/:id/status - Update driver status (suspend, fire, block) (ADMIN, OFFICE_STAFF, MANAGER, STAFF)
router.patch(
  "/:id/status",
  requireRole(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.MANAGER, UserRole.STAFF),
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  validate(updateDriverStatusSchema),
  updateDriverStatusHandler
);

// DELETE /drivers/:id - Soft delete driver (ADMIN, OFFICE_STAFF, MANAGER, STAFF)
router.delete(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.MANAGER, UserRole.STAFF),
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  softDeleteDriverHandler
);

// POST /drivers/:id/submit-cash - Submit cash to company (reset cash in hand)
router.post(
  "/:id/submit-cash",
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  submitCashToCompanyHandler
);

// POST /drivers/submit-cash-settlement - Submit cash for settlement (specified amount) (ADMIN, OFFICE_STAFF)
router.post(
  "/submit-cash-settlement",
  requireRole(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  validate(submitCashForSettlementSchema),
  submitCashForSettlementHandler
);

export default router;
