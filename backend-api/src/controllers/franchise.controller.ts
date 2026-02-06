// src/controllers/franchise.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  listFranchises,
  listFranchisesPaginated,
  getFranchise,
  createFranchise,
  updateFranchise,
  softDeleteFranchise,
  updateFranchiseStatus,
  getFranchisePersonnelDetails,
} from "../services/franchise.service";
import { CreateFranchiseDTO, UpdateFranchiseDTO, UpdateFranchiseStatusDTO } from "../types/franchise.dto";

export async function getFranchises(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Check if pagination query parameters are provided
    if (req.query.page || req.query.limit) {
      // Use validated query (parsed and transformed by middleware)
      const pagination = (req as any).validatedQuery;
      const result = await listFranchisesPaginated(pagination);
      res.json(result);
    } else {
      // Backward compatibility: return all franchises if no pagination params
      const data = await listFranchises();
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

export async function getFranchiseById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string; // UUID string
    const franchise = await getFranchise(id);
    res.json({ data: franchise });
  } catch (err) {
    next(err);
  }
}

export async function createFranchiseHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await createFranchise(req.body as CreateFranchiseDTO);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateFranchiseHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await updateFranchise(id, req.body as UpdateFranchiseDTO);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function softDeleteFranchiseHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await softDeleteFranchise(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateFranchiseStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await updateFranchiseStatus(id, req.body as UpdateFranchiseStatusDTO);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Get staff, drivers, and manager by franchise ID (combined)
 */
export async function getFranchisePersonnelHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const franchiseId = req.params.id as string;
    const result = await getFranchisePersonnelDetails(franchiseId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
