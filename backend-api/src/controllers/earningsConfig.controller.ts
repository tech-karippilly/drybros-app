// src/controllers/earningsConfig.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  getEarningsConfig,
  getEarningsConfigByFranchise,
  getEarningsConfigsByFranchises,
  getEarningsConfigByDriver,
  updateEarningsConfig,
  setFranchiseEarningsConfig,
  setDriverEarningsConfig,
} from "../services/earningsConfig.service";

/**
 * Get driver earnings configuration (global)
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
 * Update driver earnings configuration (global)
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

/**
 * Get earnings config for a franchise
 */
export async function getEarningsConfigByFranchiseHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const franchiseId = req.params.franchiseId;
    const config = await getEarningsConfigByFranchise(String(franchiseId));
    res.json({ data: config });
  } catch (err) {
    next(err);
  }
}

/**
 * Get earnings configs for multiple franchises (query: franchiseIds=id1,id2)
 */
export async function getEarningsConfigsByFranchisesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const franchiseIds = (req.query.franchiseIds as string)?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];
    if (!franchiseIds.length) {
      return res.status(400).json({ error: "franchiseIds query parameter is required (comma-separated)" });
    }
    const configs = await getEarningsConfigsByFranchises(franchiseIds);
    res.json({ data: configs });
  } catch (err) {
    next(err);
  }
}

/**
 * Set earnings config for a franchise
 */
export async function setFranchiseEarningsConfigHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const franchiseId = req.params.franchiseId;
    const userId = req.user?.userId;
    const config = await setFranchiseEarningsConfig(String(franchiseId), req.body, userId);
    res.json({ data: config });
  } catch (err) {
    next(err);
  }
}

/**
 * Get earnings config for a driver
 */
export async function getEarningsConfigByDriverHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.params.driverId;
    const config = await getEarningsConfigByDriver(String(driverId));
    res.json({ data: config });
  } catch (err) {
    next(err);
  }
}

/**
 * Set earnings config for one or more drivers (body: driverIds[], ...config)
 */
export async function setDriverEarningsConfigHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { driverIds, ...configData } = req.body;
    if (!driverIds || !Array.isArray(driverIds) || driverIds.length === 0) {
      return res.status(400).json({ error: "driverIds array is required and must not be empty" });
    }
    const userId = req.user?.userId;
    const configs = await setDriverEarningsConfig(driverIds, configData, userId);
    res.json({ data: configs });
  } catch (err) {
    next(err);
  }
}
