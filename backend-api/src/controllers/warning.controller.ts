// src/controllers/warning.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  createWarning,
  listWarnings,
  listWarningsPaginated,
  getWarning,
  deleteWarning,
} from "../services/warning.service";

export async function createWarningHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const createdBy = req.user?.userId;
    const result = await createWarning(req.body, createdBy);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getWarningsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.query.page || req.query.limit) {
      const pagination = (req as any).validatedQuery;
      const result = await listWarningsPaginated(pagination);
      res.json(result);
    } else {
      const validatedQuery = (req as any).validatedQuery;
      const filters: any = {};
      if (validatedQuery?.driverId) filters.driverId = validatedQuery.driverId;
      if (validatedQuery?.staffId) filters.staffId = validatedQuery.staffId;
      const data = await listWarnings(filters);
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

export async function getWarningByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const warning = await getWarning(id);
    res.json({ data: warning });
  } catch (err) {
    next(err);
  }
}

export async function deleteWarningHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const result = await deleteWarning(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
