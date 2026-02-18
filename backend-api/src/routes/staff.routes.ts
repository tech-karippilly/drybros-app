// src/routes/staff.routes.ts
import express from "express";
import {
  getStaffList,
  getStaffById,
  createStaffHandler,
  updateStaffHandler,
  updateStaffStatusHandler,
  deleteStaffHandler,
  getStaffHistoryHandler,
} from "../controllers/staff.controller";
import { validate, validateQuery } from "../middlewares/validation";
import { createStaffSchema, updateStaffSchema, updateStaffStatusSchema, listStaffQuerySchema } from "../types/staff.dto";
import { authMiddleware } from "../middlewares/auth";
import { z } from "zod";
import { validateParams } from "../middlewares/validation";

const router = express.Router();

// All staff routes require authentication
router.use(authMiddleware);

// GET /staff (with optional pagination)
router.get("/", validateQuery(listStaffQuerySchema), getStaffList);

// GET /staff/:id
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid() })),
  getStaffById
);

// POST /staff
router.post("/", validate(createStaffSchema), createStaffHandler);

// PATCH /staff/:id
router.patch(
  "/:id",
  validateParams(z.object({ id: z.string().uuid() })),
  validate(updateStaffSchema),
  updateStaffHandler
);

// PATCH /staff/:id/status
router.patch(
  "/:id/status",
  validateParams(z.object({ id: z.string().uuid() })),
  validate(updateStaffStatusSchema),
  updateStaffStatusHandler
);

// DELETE /staff/:id
router.delete(
  "/:id",
  validateParams(z.object({ id: z.string().uuid() })),
  deleteStaffHandler
);

// GET /staff/:id/history
router.get(
  "/:id/history",
  validateParams(z.object({ id: z.string().uuid() })),
  getStaffHistoryHandler
);

export default router;
