// src/controllers/earningsConfig.controller.ts
import { Request, Response, NextFunction } from "express";
import { getEarningsConfig, updateEarningsConfig } from "../services/earningsConfig.service";

/**
 * Get driver earnings configuration
 */
export async function getEarningsConfigHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const config = await getEarningsConfig();
    res.json({ data: config });
  } catch (err) {
    next(err);
  }
}

/**
 * Update driver earnings configuration
 */
export async function updateEarningsConfigHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    const config = await updateEarningsConfig(req.body, userId);
    res.json({ data: config });
  } catch (err) {
    next(err);
  }
}
