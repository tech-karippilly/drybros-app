// src/controllers/distance.controller.ts
import { Request, Response, NextFunction } from "express";
import { calculateDistance } from "../utils/geo";

/**
 * Calculate distance between two geographic coordinates
 * Query params: lat1, lng1, lat2, lng2
 */
export async function calculateDistanceHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const lat1 = parseFloat(req.query.lat1 as string);
    const lng1 = parseFloat(req.query.lng1 as string);
    const lat2 = parseFloat(req.query.lat2 as string);
    const lng2 = parseFloat(req.query.lng2 as string);

    // Validate coordinates
    if (
      isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2) ||
      lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
      lng1 < -180 || lng1 > 180 || lng2 < -180 || lng2 > 180
    ) {
      return res.status(400).json({
        error: "Invalid coordinates",
        message: "Please provide valid lat1, lng1, lat2, lng2 query parameters. Latitude must be between -90 and 90, longitude between -180 and 180.",
      });
    }

    const distanceKm = calculateDistance(lat1, lng1, lat2, lng2);

    res.json({
      data: {
        from: { lat: lat1, lng: lng1 },
        to: { lat: lat2, lng: lng2 },
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        distanceMeters: parseFloat((distanceKm * 1000).toFixed(0)),
      },
    });
  } catch (err) {
    next(err);
  }
}
