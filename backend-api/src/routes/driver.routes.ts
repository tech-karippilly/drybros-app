// src/routes/driver.routes.ts
import express from "express";
import { getDrivers, getDriverById, createDriverHandler } from "../controllers/driver.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";
import { validate } from "../middlewares/validation";
import { createDriverSchema } from "../types/driver.dto";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /drivers - List all drivers
router.get("/", getDrivers);

// GET /drivers/:id - Get driver by ID
router.get("/:id", getDriverById);

// POST /drivers - Create new driver (only ADMIN and OFFICE_STAFF)
router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.OFFICE_STAFF),
  validate(createDriverSchema),
  createDriverHandler
);

export default router;
