// src/controllers/staff.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  listStaff,
  listStaffPaginated,
  getStaff,
  createStaff,
  updateStaff,
  updateStaffStatus,
  deleteStaff,
  getStaffHistory,
} from "../services/staff.service";

export async function getStaffList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Check if pagination query parameters are provided
    if (req.query.page || req.query.limit) {
      // Use validated query (parsed and transformed by middleware)
      const pagination = req.validatedQuery as any;
      const result = await listStaffPaginated(pagination);
      res.json(result);
    } else {
      // Backward compatibility: return all staff if no pagination params
      const data = await listStaff();
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

export async function getStaffById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const staff = await getStaff(id);
    res.json({ data: staff });
  } catch (err) {
    next(err);
  }
}

export async function createStaffHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const changedBy = req.user?.userId;
    const result = await createStaff(req.body, changedBy);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateStaffHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const changedBy = req.user?.userId;
    const result = await updateStaff(id, req.body, changedBy);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteStaffHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const changedBy = req.user?.userId;
    const result = await deleteStaff(id, changedBy);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStaffHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const result = await getStaffHistory(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateStaffStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const result = await updateStaffStatus(id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
