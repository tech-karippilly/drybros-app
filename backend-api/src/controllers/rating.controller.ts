// src/controllers/rating.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  createDriverRating,
  listRatings,
  listRatingsPaginated,
  getRating,
} from "../services/rating.service";

/**
 * Create rating (without authentication - for customers)
 */
export async function createRatingPublicHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await createDriverRating(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Create rating (with authentication - for internal use)
 */
export async function createRatingHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await createDriverRating(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Get ratings (with authentication)
 */
export async function getRatingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.query.page || req.query.limit) {
      const pagination = (req as any).validatedQuery;
      const result = await listRatingsPaginated(pagination);
      res.json(result);
    } else {
      const validatedQuery = (req as any).validatedQuery;
      const filters: any = {};
      if (validatedQuery?.driverId) filters.driverId = validatedQuery.driverId;
      if (validatedQuery?.tripId) filters.tripId = validatedQuery.tripId;
      const data = await listRatings(filters);
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Get rating by ID (with authentication)
 */
export async function getRatingByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const rating = await getRating(String(id));
    res.json({ data: rating });
  } catch (err) {
    next(err);
  }
}
