import express from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";
import {
  getRevenueReportHandler,
  getTripReportHandler,
  getDriverReportHandler,
  getStaffReportHandler,
  getFranchiseReportHandler,
  getComplaintReportHandler,
  getAttendanceReportHandler,
} from "../controllers/reports.controller";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// GET /api/reports/revenue - Revenue Analytics
// Access: ADMIN (global), MANAGER (own franchise)
// ============================================
router.get(
  "/revenue",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  getRevenueReportHandler
);

// ============================================
// GET /api/reports/trips - Trip Analytics
// Access: ADMIN, MANAGER
// ============================================
router.get(
  "/trips",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  getTripReportHandler
);

// ============================================
// GET /api/reports/drivers - Driver Analytics
// Access: ADMIN, MANAGER, DRIVER (own summary)
// ============================================
router.get(
  "/drivers",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  getDriverReportHandler
);

// ============================================
// GET /api/reports/staff - Staff Analytics
// Access: ADMIN, MANAGER
// ============================================
router.get(
  "/staff",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  getStaffReportHandler
);

// ============================================
// GET /api/reports/franchises - Franchise Analytics
// Access: ADMIN only
// ============================================
router.get(
  "/franchises",
  requireRole(UserRole.ADMIN),
  getFranchiseReportHandler
);

// ============================================
// GET /api/reports/complaints - Complaint Trends
// Access: ADMIN, MANAGER
// ============================================
router.get(
  "/complaints",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  getComplaintReportHandler
);

// ============================================
// GET /api/reports/attendance - Attendance Analytics
// Access: ADMIN, MANAGER, DRIVER (own only)
// ============================================
router.get(
  "/attendance",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  getAttendanceReportHandler
);

export default router;
