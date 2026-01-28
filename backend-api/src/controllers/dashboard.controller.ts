// src/controllers/dashboard.controller.ts
import { Request, Response, NextFunction } from "express";
import { getDashboardMetrics } from "../services/dashboard.service";

/**
 * Get dashboard metrics
 */
export async function getDashboardMetricsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const metrics = await getDashboardMetrics();
    res.json({ data: metrics });
  } catch (err) {
    next(err);
  }
}
