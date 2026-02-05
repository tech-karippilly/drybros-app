import { Request, Response, NextFunction } from "express";
import { submitTripReview, getTripReview, createReviewLink, submitReviewWithToken } from "../services/review.service";

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

/**
 * Create a review link for a trip (Manager/Staff only)
 */
export async function createReviewLinkHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { tripId } = req.body;
    const result = await createReviewLink(tripId);
    res.status(200).json({
      message: "Review link created successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit a review using a token (Public endpoint for customers)
 */
export async function submitReviewWithTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await submitReviewWithToken(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
