// src/routes/staff.routes.ts
import express from "express";
import {
  getStaffList,
  getStaffById,
  createStaffHandler,
} from "../controllers/staff.controller";
import { validate } from "../middlewares/validation";
import { createStaffSchema } from "../types/staff.dto";
import { authMiddleware } from "../middlewares/auth";
import { z } from "zod";
import { validateParams } from "../middlewares/validation";

const router = express.Router();

// All staff routes require authentication
router.use(authMiddleware);

// GET /staff
router.get("/", getStaffList);

// GET /staff/:id
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid() })),
  getStaffById
);

// POST /staff
router.post("/", validate(createStaffSchema), createStaffHandler);

export default router;
