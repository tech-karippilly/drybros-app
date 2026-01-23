// src/routes/attendance.routes.ts
import express from "express";
import {
  clockInHandler,
  clockOutHandler,
  getAttendancesHandler,
  getAttendanceByIdHandler,
} from "../controllers/attendance.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, validateQuery, validateParams } from "../middlewares/validation";
import { clockInSchema, clockOutSchema, attendancePaginationQuerySchema } from "../types/attendance.dto";
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

// GET /attendance/:id
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid attendance ID format") })),
  getAttendanceByIdHandler
);

export default router;
