import { Request, Response, NextFunction } from "express";
import {
  submitTripReview,
  submitDriverRating,
} from "../services/review.service";

// ============================================
// SUBMIT TRIP REVIEW
// ============================================

export async function submitTripReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get customerId from authenticated customer
    const customerId = req.customer?.customerId;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required",
      });
    }

    const result = await submitTripReview(req.body, customerId);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// SUBMIT DRIVER RATING
// ============================================

export async function submitDriverRatingHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get customerId from authenticated customer
    const customerId = req.customer?.customerId;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required",
      });
    }

    const result = await submitDriverRating(req.body, customerId);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
