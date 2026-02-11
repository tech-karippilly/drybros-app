// src/routes/report.routes.ts

import express from "express";
import {
  getTripReportHandler,
  getDriverPerformanceReportHandler,
  getAttendanceReportHandler,
  getDispatchReportHandler,
  exportTripReportHandler,
  exportAttendanceReportHandler,
} from "../controllers/report.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// All report routes require authentication
router.use(authMiddleware);

/**
 * Trip Reports
 * Admin/Manager: All trips
 * Driver: Own trips only (filtered by service)
 */
router.get(
  "/trips",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICE_STAFF),
  getTripReportHandler
);

router.get(
  "/trips/export",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICE_STAFF),
  exportTripReportHandler
);

/**
 * Driver Performance Report
 * Admin/Manager: Any driver
 * Driver: Own performance only (validated in service)
 */
router.get(
  "/driver-performance/:driverId",
  getDriverPerformanceReportHandler
);

/**
 * Attendance Reports
 * Admin/Manager: All drivers
 * Driver: Own attendance (filtered by service)
 */
router.get(
  "/attendance",
  getAttendanceReportHandler
);

router.get(
  "/attendance/export",
  exportAttendanceReportHandler
);

/**
 * Dispatch/System Report
 * Admin/Manager only
 */
router.get(
  "/dispatch",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  getDispatchReportHandler
);

export default router;
