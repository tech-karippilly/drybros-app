// src/controllers/driver.controller.ts
import { Request, Response, NextFunction } from "express";
import { listDrivers, getDriver, createDriver } from "../services/driver.service";

export async function getDrivers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listDrivers();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getDriverById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id; // UUID string
    const driver = await getDriver(id);
    res.json({ data: driver });
  } catch (err) {
    next(err);
  }
}

export async function createDriverHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const createdBy = req.user?.userId;
    const result = await createDriver(req.body, createdBy);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
