// src/routes/earningsConfig.routes.ts
import express from "express";
import { getEarningsConfigHandler, updateEarningsConfigHandler } from "../controllers/earningsConfig.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /config/driver-earnings - Get earnings config (all authenticated users)
router.get("/driver-earnings", getEarningsConfigHandler);

// POST /config/driver-earnings - Set earnings config (admin only)
router.post(
  "/driver-earnings",
  requireRole(UserRole.ADMIN),
  updateEarningsConfigHandler
);

// PATCH /config/driver-earnings - Update earnings config (admin only)
router.patch(
  "/driver-earnings",
  requireRole(UserRole.ADMIN),
  updateEarningsConfigHandler
);

export default router;
