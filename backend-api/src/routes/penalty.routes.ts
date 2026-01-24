// src/routes/penalty.routes.ts
import express from "express";
import {
  createPenaltyHandler,
  getPenaltiesHandler,
  getPenaltyByIdHandler,
  updatePenaltyHandler,
  deletePenaltyHandler,
  applyPenaltyToDriverHandler,
  applyPenaltyToDriversHandler,
  getDriverPenaltiesHandler,
  getDriverPenaltyByIdHandler,
  updateDriverPenaltyHandler,
  deleteDriverPenaltyHandler,
  setDriverDailyLimitHandler,
  setDriversDailyLimitHandler,
} from "../controllers/penalty.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { validate, validateQuery, validateParams } from "../middlewares/validation";
import {
  createPenaltySchema,
  updatePenaltySchema,
  applyPenaltyToDriverSchema,
  applyPenaltyToDriversSchema,
  penaltyPaginationQuerySchema,
  driverPenaltyPaginationQuerySchema,
  setDriverDailyLimitSchema,
  setDriversDailyLimitSchema,
} from "../types/penalty.dto";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Penalty management routes (Admin and Manager only)
router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(createPenaltySchema),
  createPenaltyHandler
);

router.get(
  "/",
  validateQuery(penaltyPaginationQuerySchema),
  getPenaltiesHandler
);

router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid penalty ID format") })),
  getPenaltyByIdHandler
);

router.patch(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ id: z.string().uuid("Invalid penalty ID format") })),
  validate(updatePenaltySchema),
  updatePenaltyHandler
);

router.delete(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ id: z.string().uuid("Invalid penalty ID format") })),
  deletePenaltyHandler
);

// Apply penalty to drivers (Admin and Manager only)
router.post(
  "/apply/driver/:driverId",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ driverId: z.string().uuid("Invalid driver ID format") })),
  validate(applyPenaltyToDriverSchema),
  applyPenaltyToDriverHandler
);

router.post(
  "/apply/drivers",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(applyPenaltyToDriversSchema),
  applyPenaltyToDriversHandler
);

// Driver penalties routes
router.get(
  "/driver-penalties",
  validateQuery(driverPenaltyPaginationQuerySchema),
  getDriverPenaltiesHandler
);

router.get(
  "/driver-penalties/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid driver penalty ID format") })),
  getDriverPenaltyByIdHandler
);

router.patch(
  "/driver-penalties/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ id: z.string().uuid("Invalid driver penalty ID format") })),
  updateDriverPenaltyHandler
);

router.delete(
  "/driver-penalties/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ id: z.string().uuid("Invalid driver penalty ID format") })),
  deleteDriverPenaltyHandler
);

// Daily limit routes (Admin and Manager only)
router.patch(
  "/daily-limit/driver/:driverId",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ driverId: z.string().uuid("Invalid driver ID format") })),
  validate(setDriverDailyLimitSchema),
  setDriverDailyLimitHandler
);

router.patch(
  "/daily-limit/drivers",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(setDriversDailyLimitSchema),
  setDriversDailyLimitHandler
);

export default router;
