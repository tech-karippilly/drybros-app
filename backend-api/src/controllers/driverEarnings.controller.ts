// src/controllers/driverEarnings.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  getDriverDailyStats,
  getDriverMonthlyStats,
  getDriverSettlement,
} from "../services/driverEarnings.service";

/**
 * Get daily stats for a driver
 */
export async function getDriverDailyStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.params.id;
    const date = req.query.date as string | undefined;

    const stats = await getDriverDailyStats(String(driverId), date);
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}

/**
 * Get monthly stats for a driver
 */
export async function getDriverMonthlyStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.params.id;
    const year = parseInt(req.query.year as string);
    const month = parseInt(req.query.month as string);

    if (!year || !month) {
      return res.status(400).json({
        error: "year and month query parameters are required",
      });
    }

    const stats = await getDriverMonthlyStats(String(driverId), year, month);
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}

/**
 * Get settlement for a driver
 */
export async function getDriverSettlementHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.params.id;
    const year = parseInt(req.query.year as string);
    const month = parseInt(req.query.month as string);

    if (!year || !month) {
      return res.status(400).json({
        error: "year and month query parameters are required",
      });
    }

    const settlement = await getDriverSettlement(String(driverId), year, month);
    res.json({ data: settlement });
  } catch (err) {
    next(err);
  }
}
