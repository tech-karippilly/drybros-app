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
    // Get validated query (includes optional franchiseId, page, limit with defaults)
    const validatedQuery = (req as any).validatedQuery as any;
    const franchiseId = validatedQuery?.franchiseId;
    
    // Check if pagination query parameters were explicitly provided in raw query
    // (validatedQuery always has page/limit due to defaults, so we check raw query)
    if (req.query.page || req.query.limit) {
      // Use paginated endpoint with optional franchiseId filter
      const result = await listStaffPaginated(validatedQuery);
      res.json(result);
    } else {
      // Backward compatibility: return all staff if no pagination params
      // franchiseId is optional - if not provided, returns all staff across all franchises
      const data = await listStaff(franchiseId);
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
    const staff = await getStaff(String(id));
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
    const result = await updateStaff(String(id), req.body, changedBy);
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
    const result = await deleteStaff(String(id), changedBy);
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
    const result = await getStaffHistory(String(id));
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
    const result = await updateStaffStatus(String(id), req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
