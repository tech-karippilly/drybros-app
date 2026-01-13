// src/controllers/driver.controller.ts
import { Request, Response, NextFunction } from "express";
import { listDrivers, getDriver } from "../services/driver.service";

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
    const id = Number(req.params.id);
    const driver = await getDriver(id);
    res.json({ data: driver });
  } catch (err) {
    next(err);
  }
}
