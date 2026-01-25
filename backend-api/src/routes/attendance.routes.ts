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
} from "../controllers/attendance.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, validateQuery, validateParams } from "../middlewares/validation";
import { 
  clockInSchema, 
  clockOutSchema, 
  attendancePaginationQuerySchema,
  createAttendanceSchema,
  updateAttendanceSchema,
} from "../types/attendance.dto";
import { z } from "zod";

const router = express.Router();

// All attendance routes require authentication
router.use(authMiddleware);

// POST /attendance/clock-in
router.post("/clock-in", validate(clockInSchema), clockInHandler);

// POST /attendance/clock-out
router.post("/clock-out", validate(clockOutSchema), clockOutHandler);

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

export default router;
