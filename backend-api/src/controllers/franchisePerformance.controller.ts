// src/controllers/franchisePerformance.controller.ts
import { Request, Response, NextFunction } from "express";
import { getFranchisePerformance } from "../services/franchisePerformance.service";

/**
 * GET /admin/franchises/:id/performance
 * Get franchise performance metrics
 */
export async function getFranchisePerformanceHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const franchiseId = req.params.id as string;
    const metrics = await getFranchisePerformance(franchiseId);
    res.json({ data: metrics });
  } catch (err) {
    next(err);
  }
}
