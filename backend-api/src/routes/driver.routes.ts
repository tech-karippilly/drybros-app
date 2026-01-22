// src/routes/driver.routes.ts
import express from "express";
import { getDrivers, getDriverById, getDriverWithPerformanceHandler, getDriverPerformanceHandler, getAvailableGreenDriversHandler, createDriverHandler, loginDriverHandler, updateDriverHandler, updateDriverStatusHandler, softDeleteDriverHandler } from "../controllers/driver.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";
import { validate, validateParams, validateQuery } from "../middlewares/validation";
import { createDriverSchema, driverLoginSchema, updateDriverSchema, updateDriverStatusSchema, paginationQuerySchema } from "../types/driver.dto";
import { z } from "zod";

const router = express.Router();

// Public route - Driver login (no authentication required)
router.post("/login", validate(driverLoginSchema), loginDriverHandler);

// All other driver routes require authentication
router.use(authMiddleware);

// GET /drivers (with optional pagination and performance)
router.get("/", validateQuery(paginationQuerySchema), getDrivers);
router.get(
  "/available/green",
  validateQuery(z.object({ franchiseId: z.string().uuid("Invalid franchise ID format").optional() })),
  getAvailableGreenDriversHandler
);
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

// POST /drivers - Create new driver (only ADMIN and OFFICE_STAFF)
router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  validate(createDriverSchema),
  createDriverHandler
);

// PATCH /drivers/:id - Update driver (only ADMIN and OFFICE_STAFF)
router.patch(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  validate(updateDriverSchema),
  updateDriverHandler
);

// PATCH /drivers/:id/status - Update driver status (suspend, fire, block) (only ADMIN and OFFICE_STAFF)
router.patch(
  "/:id/status",
  requireRole(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  validate(updateDriverStatusSchema),
  updateDriverStatusHandler
);

// DELETE /drivers/:id - Soft delete driver (only ADMIN and OFFICE_STAFF)
router.delete(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  validateParams(z.object({ id: z.string().uuid("Invalid driver ID format") })),
  softDeleteDriverHandler
);

export default router;
