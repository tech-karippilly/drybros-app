import { Request, Response, NextFunction } from "express";
import { submitTripReview, getTripReview } from "../services/review.service";

export async function createTripReviewPublicHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await submitTripReview(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getTripReviewByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await getTripReview(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
