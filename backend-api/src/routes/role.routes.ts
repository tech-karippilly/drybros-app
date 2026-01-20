// src/routes/role.routes.ts
import express from "express";
import {
  getRoles,
  getRoleById,
  createRoleHandler,
  updateRoleHandler,
  deleteRoleHandler,
} from "../controllers/role.controller";
import { z } from "zod";
import { validate, validateParams } from "../middlewares/validation";
import {
  createRoleSchema,
  updateRoleSchema,
  uuidSchema,
} from "../types/role.dto";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// All role routes require authentication
router.use(authMiddleware);

// GET /roles
router.get("/", getRoles);

// GET /roles/:id
router.get(
  "/:id",
  validateParams(z.object({ id: uuidSchema })),
  getRoleById
);

// POST /roles
router.post("/", validate(createRoleSchema), createRoleHandler);

// PUT /roles/:id
router.put(
  "/:id",
  validateParams(z.object({ id: uuidSchema })),
  validate(updateRoleSchema),
  updateRoleHandler
);

// DELETE /roles/:id
router.delete(
  "/:id",
  validateParams(z.object({ id: uuidSchema })),
  deleteRoleHandler
);

export default router;
