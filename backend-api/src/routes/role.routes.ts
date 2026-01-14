// src/routes/role.routes.ts
import express from "express";
import {
  getRoles,
  getRoleById,
  createRoleHandler,
  updateRoleHandler,
  deleteRoleHandler,
} from "../controllers/role.controller";

const router = express.Router();

// GET /roles
router.get("/", getRoles);

// GET /roles/:id
router.get("/:id", getRoleById);

// POST /roles
router.post("/", createRoleHandler);

// PUT /roles/:id
router.put("/:id", updateRoleHandler);

// DELETE /roles/:id
router.delete("/:id", deleteRoleHandler);

export default router;
