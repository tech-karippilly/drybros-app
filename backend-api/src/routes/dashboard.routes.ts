// src/routes/dashboard.routes.ts
import express from "express";
import { getAdminDashboardHandler, getDashboardMetricsHandler } from "../controllers/dashboard.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router = express.Router();

// GET /dashboard/metrics
router.get("/metrics", authMiddleware, getDashboardMetricsHandler);
router.get('/admin/dashboard',requireRole('ADMIN'),getAdminDashboardHandler)

export default router;
