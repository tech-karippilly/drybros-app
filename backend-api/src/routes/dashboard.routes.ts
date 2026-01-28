// src/routes/dashboard.routes.ts
import express from "express";
import { getDashboardMetricsHandler } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// GET /dashboard/metrics
router.get("/metrics", authMiddleware, getDashboardMetricsHandler);

export default router;
