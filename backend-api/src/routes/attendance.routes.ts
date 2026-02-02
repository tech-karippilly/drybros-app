// src/routes/attendance.routes.ts
import express from "express";
import {
  clockInHandler,
  clockOutHandler,
  getAttendancesHandler,
  getAttendanceByIdHandler,
  createAttendanceHandler,
  updateAttendanceHandler,
  deleteAttendanceHandler,
  updateAttendanceStatusHandler,
} from "../controllers/attendance.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, validateQuery, validateParams } from "../middlewares/validation";
import { 
  clockInSchema, 
  clockOutSchema, 
  attendancePaginationQuerySchema,
  createAttendanceSchema,
  updateAttendanceSchema,
  updateAttendanceStatusSchema,
} from "../types/attendance.dto";
import { z } from "zod";
import { requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// All attendance routes require authentication
router.use(authMiddleware);

// POST /attendance/clock-in
router.post(
  "/clock-in",
  requireRole(UserRole.DRIVER, UserRole.STAFF, UserRole.MANAGER, UserRole.OFFICE_STAFF),
  validate(clockInSchema),
  clockInHandler
);

// POST /attendance/clock-out
router.post(
  "/clock-out",
  requireRole(UserRole.DRIVER, UserRole.STAFF, UserRole.MANAGER, UserRole.OFFICE_STAFF),
  validate(clockOutSchema),
  clockOutHandler
);

// GET /attendance/all - Admin only
router.get(
  "/all",
  requireRole(UserRole.ADMIN),
  validateQuery(attendancePaginationQuerySchema),
  getAttendancesHandler
);

// GET /attendance/admins - Admin only
router.get(
  "/admins",
  requireRole(UserRole.ADMIN),
  validateQuery(attendancePaginationQuerySchema),
  getAttendancesHandler
);

// GET /attendance/managers - Admin only
router.get(
  "/managers",
  requireRole(UserRole.ADMIN),
  validateQuery(attendancePaginationQuerySchema),
  getAttendancesHandler
);

// GET /attendance/staff - Admin and Manager
router.get(
  "/staff",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateQuery(attendancePaginationQuerySchema),
  getAttendancesHandler
);

// GET /attendance/drivers - Admin, Manager, Staff
router.get(
  "/drivers",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICE_STAFF),
  validateQuery(attendancePaginationQuerySchema),
  getAttendancesHandler
);

// GET /attendance (with optional pagination and filters)
router.get("/", validateQuery(attendancePaginationQuerySchema), getAttendancesHandler);

// POST /attendance - Create new attendance record
router.post("/", validate(createAttendanceSchema), createAttendanceHandler);

// GET /attendance/:id - Get attendance by ID
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid attendance ID format") })),
  getAttendanceByIdHandler
);

// PUT /attendance/:id - Update attendance record
router.put(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid attendance ID format") })),
  validate(updateAttendanceSchema),
  updateAttendanceHandler
);

// DELETE /attendance/:id - Delete attendance record
router.delete(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid attendance ID format") })),
  deleteAttendanceHandler
);

// PATCH /attendance/:id/status - Update attendance status with description
router.patch(
  "/:id/status",
  validateParams(z.object({ id: z.string().uuid("Invalid attendance ID format") })),
  validate(updateAttendanceStatusSchema),
  updateAttendanceStatusHandler
);

export default router;
