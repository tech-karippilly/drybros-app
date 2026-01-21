// src/routes/franchise.routes.ts
import express from "express";
import {
  getFranchises,
  getFranchiseById,
  createFranchiseHandler,
} from "../controllers/franchise.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { validate, validateParams } from "../middlewares/validation";
import { createFranchiseSchema } from "../types/franchise.dto";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const router = express.Router();

// All franchise routes require authentication
router.use(authMiddleware);

router.get("/", getFranchises);
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid franchise ID format") })),
  getFranchiseById
);

// POST /franchises - Create new franchise (only ADMIN can create)
router.post(
  "/",
  requireRole(UserRole.ADMIN),
  validate(createFranchiseSchema),
  createFranchiseHandler
);

export default router;
