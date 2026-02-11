import { Request, Response, NextFunction } from "express";
import { TripPricingType, CarCategory } from "@prisma/client";
import {
  listTripTypes,
  listTripTypesPaginated,
  getTripTypeById,
  createTripType,
  updateTripType,
  deleteTripType,
} from "../services/tripType.service";

export async function listTripTypesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Check if pagination query parameters are provided
    if (req.query.page || req.query.limit) {
      // Parse and validate pagination parameters
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = Math.min(
        parseInt(req.query.limit as string, 10) || 10,
        100
      ); // Max 100 items per page

      if (page < 1) {
        return res.status(400).json({
          error: "Page must be a positive integer",
        });
      }

      if (limit < 1) {
        return res.status(400).json({
          error: "Limit must be a positive integer",
        });
      }

      const result = await listTripTypesPaginated({ page, limit });
      res.json(result);
    } else {
      // Check if carCategory filter is provided
      const carCategory = req.query.carCategory as CarCategory | undefined;
      
      // Return all trip types or filtered by car category
      const data = await listTripTypes(carCategory);
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

export async function getTripTypeByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const tripType = await getTripTypeById(String(id));

    if (!tripType) {
      return res.status(404).json({
        error: "Trip type not found",
      });
    }

    res.json({ data: tripType });
  } catch (err) {
    next(err);
  }
}

export async function createTripTypeHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripType = await createTripType(req.body);
    res.status(201).json({ data: tripType });
  } catch (err) {
    next(err);
  }
}

export async function updateTripTypeHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const tripType = await updateTripType(String(id), req.body);
    res.json({ data: tripType });
  } catch (err) {
    next(err);
  }
}

export async function deleteTripTypeHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const result = await deleteTripType(String(id));
    res.json(result);
  } catch (err) {
    next(err);
  }
}
