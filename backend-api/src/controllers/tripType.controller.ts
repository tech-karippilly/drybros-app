import { Request, Response, NextFunction } from "express";
import { CarType } from "@prisma/client";
import {
  listTripTypes,
  listTripTypesPaginated,
  getTripTypeById,
  createTripType,
  updateTripType,
  deleteTripType,
} from "../services/tripType.service";

/**
 * Filter trip types by car type - only return pricing for specified car type
 */
function filterByCarType(tripTypes: any[], carType: CarType) {
  return tripTypes.map((tripType) => ({
    ...tripType,
    carTypePricing: tripType.carTypePricing?.filter(
      (pricing: any) => pricing.carType === carType
    ),
  }));
}

export async function listTripTypesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const carType = req.query.carType as CarType | undefined;

    // Validate carType if provided
    if (carType && !Object.values(CarType).includes(carType)) {
      return res.status(400).json({
        error: `Invalid car type. Must be one of: ${Object.values(CarType).join(", ")}`,
      });
    }

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

      // Filter by car type if specified
      if (carType) {
        result.data = filterByCarType(result.data, carType);
      }

      res.json(result);
    } else {
      // Backward compatibility: return all trip types if no pagination params
      let data = await listTripTypes();

      // Filter by car type if specified
      if (carType) {
        data = filterByCarType(data, carType);
      }

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
    const carType = req.query.carType as CarType | undefined;

    // Validate carType if provided
    if (carType && !Object.values(CarType).includes(carType)) {
      return res.status(400).json({
        error: `Invalid car type. Must be one of: ${Object.values(CarType).join(", ")}`,
      });
    }

    let tripType = await getTripTypeById(id);

    // Filter by car type if specified
    if (carType && tripType) {
      tripType = {
        ...tripType,
        carTypePricing: tripType.carTypePricing?.filter(
          (pricing: any) => pricing.carType === carType
        ),
      };
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
    const tripType = await updateTripType(id, req.body);
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
    await deleteTripType(id);
    res.json({ message: "Trip type deleted successfully" });
  } catch (err) {
    next(err);
  }
}
