// src/routes/warning.routes.ts
import express from "express";
import {
  createWarningHandler,
  getWarningsHandler,
  getWarningByIdHandler,
  deleteWarningHandler,
} from "../controllers/warning.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, validateQuery, validateParams } from "../middlewares/validation";
import { createWarningSchema, warningPaginationQuerySchema } from "../types/warning.dto";
import { z } from "zod";

const router = express.Router();

// All warning routes require authentication
router.use(authMiddleware);

// GET /warnings (with optional pagination and filters)
router.get("/", validateQuery(warningPaginationQuerySchema), getWarningsHandler);

// GET /warnings/:id
router.get(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid warning ID format") })),
  getWarningByIdHandler
);

// POST /warnings
router.post("/", validate(createWarningSchema), createWarningHandler);

// DELETE /warnings/:id
router.delete(
  "/:id",
  validateParams(z.object({ id: z.string().uuid("Invalid warning ID format") })),
  deleteWarningHandler
);

export default router;
