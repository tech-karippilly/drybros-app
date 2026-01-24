// src/routes/earningsConfig.routes.ts
import express from "express";
import {
  getEarningsConfigHandler,
  updateEarningsConfigHandler,
  getEarningsConfigByFranchiseHandler,
  getEarningsConfigsByFranchisesHandler,
  setFranchiseEarningsConfigHandler,
  getEarningsConfigByDriverHandler,
  setDriverEarningsConfigHandler,
} from "../controllers/earningsConfig.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.use(authMiddleware);

// Franchise-specific routes (must be before /driver-earnings to avoid conflict)
router.get(
  "/driver-earnings/franchises",
  getEarningsConfigsByFranchisesHandler
);
router.get(
  "/driver-earnings/franchise/:franchiseId",
  getEarningsConfigByFranchiseHandler
);
router.post(
  "/driver-earnings/franchise/:franchiseId",
  requireRole(UserRole.ADMIN),
  setFranchiseEarningsConfigHandler
);

// Driver-specific routes
router.get(
  "/driver-earnings/driver/:driverId",
  getEarningsConfigByDriverHandler
);
router.post(
  "/driver-earnings/drivers",
  requireRole(UserRole.ADMIN),
  setDriverEarningsConfigHandler
);

// Global config
router.get("/driver-earnings", getEarningsConfigHandler);
router.post(
  "/driver-earnings",
  requireRole(UserRole.ADMIN),
  updateEarningsConfigHandler
);
router.patch(
  "/driver-earnings",
  requireRole(UserRole.ADMIN),
  updateEarningsConfigHandler
);

export default router;
