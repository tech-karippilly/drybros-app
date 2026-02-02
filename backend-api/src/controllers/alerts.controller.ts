import { Request, Response, NextFunction } from "express";
import { getDriverAlerts } from "../services/alerts.service";

/**
 * GET /alerts/my
 * Driver Alerts feed (driver token required).
 */
export async function getMyDriverAlertsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const driverId = req.driver?.driverId;
    if (!driverId) {
      return res.status(401).json({ error: "Driver authentication required" });
    }

    const limit = (req as any).validatedQuery?.limit as number | undefined;
    const data = await getDriverAlerts(driverId, limit);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

