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
  getMonitorDataHandler,
  getAttendanceStatusHandler,
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
import { requireRole, requireRoleOrDriver } from "../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// All attendance routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance tracking and management
 */

/**
 * @swagger
 * /attendance/clock-in:
 *   post:
 *     summary: Clock in for attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: User ID for staff/manager or driver ID for drivers
 *               latitude:
 *                 type: number
 *                 description: Latitude for location tracking (optional)
 *               longitude:
 *                 type: number
 *                 description: Longitude for location tracking (optional)
 *             required:
 *               - id
 *     responses:
 *       201:
 *         description: Clock-in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Clock-in successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendance:
 *                       $ref: '#/components/schemas/AttendanceResponse'
 *                     session:
 *                       $ref: '#/components/schemas/AttendanceSession'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/clock-in",
  requireRoleOrDriver(UserRole.DRIVER, UserRole.STAFF, UserRole.MANAGER, UserRole.OFFICE_STAFF),
  validate(clockInSchema),
  clockInHandler
);

/**
 * @swagger
 * /attendance/clock-out:
 *   post:
 *     summary: Clock out for attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: User ID for staff/manager or driver ID for drivers
 *               latitude:
 *                 type: number
 *                 description: Latitude for location tracking (optional)
 *               longitude:
 *                 type: number
 *                 description: Longitude for location tracking (optional)
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: Clock-out successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Clock-out successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendance:
 *                       $ref: '#/components/schemas/AttendanceResponse'
 *                     session:
 *                       $ref: '#/components/schemas/AttendanceSession'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/clock-out",
  requireRoleOrDriver(UserRole.DRIVER, UserRole.STAFF, UserRole.MANAGER, UserRole.OFFICE_STAFF),
  validate(clockOutSchema),
  clockOutHandler
);

/**
 * @swagger
 * /attendance/monitor:
 *   get:
 *     summary: Get attendance monitor data
 *     description: Get real-time attendance monitoring data for dashboard
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monitor data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 online:
 *                   type: number
 *                   description: Number of people currently online
 *                 offline:
 *                   type: number
 *                   description: Number of people currently offline
 *                 present:
 *                   type: number
 *                   description: Number of people present
 *                 absent:
 *                   type: number
 *                   description: Number of people absent
 *                 rows:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AttendanceMonitorRow'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/monitor",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICE_STAFF),
  getMonitorDataHandler
);

/**
 * @swagger
 * /attendance/status/{id}:
 *   get:
 *     summary: Get attendance status by person ID
 *     description: Get attendance status for a specific person (driver/staff/user)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Person ID (driver, staff, or user ID)
 *     responses:
 *       200:
 *         description: Attendance status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceStatus'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Person not found
 */
router.get(
  "/status/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid person ID format") })),
  getAttendanceStatusHandler
);

/**
 * @swagger
 * /attendance/all:
 *   get:
 *     summary: Get all attendance records (Admin only)
 *     description: Get all attendance records with optional filters and pagination (Admin only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver ID
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by staff ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: franchiseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by franchise ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, ABSENT, LEAVE]
 *         description: Filter by attendance status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAttendanceResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get(
  "/all",
  requireRole(UserRole.ADMIN),
  validateQuery(attendancePaginationQuerySchema),
  getAttendancesHandler
);

/**
 * @swagger
 * /attendance/admins:
 *   get:
 *     summary: Get admin attendance records (Admin only)
 *     description: Get attendance records for admin users with optional filters and pagination (Admin only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver ID
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by staff ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: franchiseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by franchise ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, ABSENT, LEAVE]
 *         description: Filter by attendance status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Admin attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAttendanceResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get(
  "/admins",
  requireRole(UserRole.ADMIN),
  validateQuery(attendancePaginationQuerySchema),
  getAttendancesHandler
);

/**
 * @swagger
 * /attendance/managers:
 *   get:
 *     summary: Get manager attendance records (Admin only)
 *     description: Get attendance records for managers with optional filters and pagination (Admin only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver ID
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by staff ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: franchiseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by franchise ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, ABSENT, LEAVE]
 *         description: Filter by attendance status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Manager attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAttendanceResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get(
  "/managers",
  requireRole(UserRole.ADMIN),
  validateQuery(attendancePaginationQuerySchema),
  getAttendancesHandler
);

/**
 * @swagger
 * /attendance/staff:
 *   get:
 *     summary: Get staff attendance records (Admin and Manager)
 *     description: Get attendance records for staff with optional filters and pagination (Admin and Manager)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver ID
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by staff ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: franchiseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by franchise ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, ABSENT, LEAVE]
 *         description: Filter by attendance status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Staff attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAttendanceResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin and Manager only)
 */
router.get(
  "/staff",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateQuery(attendancePaginationQuerySchema),
  getAttendancesHandler
);

/**
 * @swagger
 * /attendance/drivers:
 *   get:
 *     summary: Get driver attendance records (Admin, Manager, Staff)
 *     description: Get attendance records for drivers with optional filters and pagination (Admin, Manager, Staff)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver ID
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by staff ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: franchiseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by franchise ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, ABSENT, LEAVE]
 *         description: Filter by attendance status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Driver attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAttendanceResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin, Manager, Staff only)
 */
router.get(
  "/drivers",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICE_STAFF),
  validateQuery(attendancePaginationQuerySchema),
  getAttendancesHandler
);

/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: Get attendance records with filters
 *     description: Get attendance records with optional filters and pagination
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver ID
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by staff ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: franchiseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by franchise ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, ABSENT, LEAVE]
 *         description: Filter by attendance status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAttendanceResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", validateQuery(attendancePaginationQuerySchema), getAttendancesHandler);

/**
 * @swagger
 * /attendance:
 *   post:
 *     summary: Create a new attendance record
 *     description: Create a new attendance record (Admin only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               driverId:
 *                 type: string
 *                 format: uuid
 *                 description: Driver ID (optional if staffId or userId provided)
 *               staffId:
 *                 type: string
 *                 format: uuid
 *                 description: Staff ID (optional if driverId or userId provided)
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID (optional if driverId or staffId provided)
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of attendance
 *               loginTime:
 *                 type: string
 *                 format: date-time
 *                 description: Login time (optional)
 *               clockIn:
 *                 type: string
 *                 format: date-time
 *                 description: Clock-in time (optional)
 *               clockOut:
 *                 type: string
 *                 format: date-time
 *                 description: Clock-out time (optional)
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LEAVE]
 *                 description: Attendance status
 *               notes:
 *                 type: string
 *                 description: Additional notes (optional)
 *             required:
 *               - date
 *               - status
 *     responses:
 *       201:
 *         description: Attendance record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleAttendanceResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.post("/", validate(createAttendanceSchema), createAttendanceHandler);

/**
 * @swagger
 * /attendance/{id}:
 *   get:
 *     summary: Get attendance record by ID
 *     description: Get a specific attendance record by ID
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attendance record ID
 *     responses:
 *       200:
 *         description: Attendance record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AttendanceResponse'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attendance record not found
 */
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid attendance ID format") })),
  getAttendanceByIdHandler
);

/**
 * @swagger
 * /attendance/{id}:
 *   put:
 *     summary: Update attendance record
 *     description: Update a specific attendance record (Admin only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attendance record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loginTime:
 *                 type: string
 *                 format: date-time
 *                 description: Login time (optional)
 *               clockIn:
 *                 type: string
 *                 format: date-time
 *                 description: Clock-in time (optional)
 *               clockOut:
 *                 type: string
 *                 format: date-time
 *                 description: Clock-out time (optional)
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LEAVE]
 *                 description: Attendance status (optional)
 *               notes:
 *                 type: string
 *                 description: Additional notes (optional)
 *     responses:
 *       200:
 *         description: Attendance record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleAttendanceResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Attendance record not found
 */
router.put(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid attendance ID format") })),
  validate(updateAttendanceSchema),
  updateAttendanceHandler
);

/**
 * @swagger
 * /attendance/{id}:
 *   delete:
 *     summary: Delete attendance record
 *     description: Delete a specific attendance record (Admin only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attendance record ID
 *     responses:
 *       200:
 *         description: Attendance record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Attendance record deleted successfully"
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Attendance record not found
 */
router.delete(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid attendance ID format") })),
  deleteAttendanceHandler
);

/**
 * @swagger
 * /attendance/{id}/status:
 *   patch:
 *     summary: Update attendance status
 *     description: Update the status of a specific attendance record with description (Admin only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attendance record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LEAVE]
 *                 description: New attendance status
 *               notes:
 *                 type: string
 *                 description: Reason or notes for status update (optional)
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Attendance status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleAttendanceResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Attendance record not found
 */
router.patch(
  "/:id/status",
  validateParams(z.object({ id: z.string().uuid("Invalid attendance ID format") })),
  validate(updateAttendanceStatusSchema),
  updateAttendanceStatusHandler
);

export default router;
