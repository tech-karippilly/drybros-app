// src/controllers/attendance.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  clockIn,
  clockOut,
  listAttendances,
  listAttendancesPaginated,
  getAttendance,
} from "../services/attendance.service";

export async function clockInHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await clockIn(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function clockOutHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await clockOut(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAttendancesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.query.page || req.query.limit) {
      const pagination = (req as any).validatedQuery;
      const result = await listAttendancesPaginated(pagination);
      res.json(result);
    } else {
      const validatedQuery = (req as any).validatedQuery;
      const filters: any = {};
      if (validatedQuery?.driverId) filters.driverId = validatedQuery.driverId;
      if (validatedQuery?.staffId) filters.staffId = validatedQuery.staffId;
      if (validatedQuery?.startDate) filters.startDate = new Date(validatedQuery.startDate);
      if (validatedQuery?.endDate) filters.endDate = new Date(validatedQuery.endDate);
      const data = await listAttendances(filters);
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

export async function getAttendanceByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const attendance = await getAttendance(id);
    res.json({ data: attendance });
  } catch (err) {
    next(err);
  }
}
