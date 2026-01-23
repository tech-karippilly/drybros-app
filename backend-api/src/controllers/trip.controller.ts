import { Request, Response, NextFunction } from "express";
import {
  listTrips,
  getTrip,
  createTrip,
  createTripPhase1,
  driverAcceptTrip,
  driverRejectTrip,
  generateStartOtpForTrip,
  startTripWithOtp,
  generateEndOtpForTrip,
  endTripWithOtp,
  listUnassignedTrips,
  listTripsPaginated,
  listUnassignedTripsPaginated,
  getAvailableDriversForTrip,
  assignDriverToTrip,
  getDriverAssignedTrips,
} from "../services/trip.service";
import { PaymentStatus, PaymentMode } from "@prisma/client";

export async function getTrips(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Check if pagination parameters are provided
    if (req.query.page || req.query.limit) {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 per page
      
      if (page < 1 || limit < 1) {
        return res.status(400).json({
          error: "Page and limit must be positive numbers",
        });
      }

      const result = await listTripsPaginated({ page, limit });
      res.json(result);
    } else {
      // Backward compatibility: return all trips if no pagination params
      const data = await listTrips();
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

export async function getUnassignedTripsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Check if pagination parameters are provided
    if (req.query.page || req.query.limit) {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 per page
      
      if (page < 1 || limit < 1) {
        return res.status(400).json({
          error: "Page and limit must be positive numbers",
        });
      }

      const result = await listUnassignedTripsPaginated({ page, limit });
      res.json(result);
    } else {
      // Return all unassigned trips if no pagination params
      const data = await listUnassignedTrips();
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

export async function getTripByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: "Invalid trip ID format. Expected UUID.",
      });
    }
    
    const trip = await getTrip(id);
    res.json({ data: trip });
  } catch (err) {
    next(err);
  }
}

export async function createTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const trip = await createTrip(req.body);
    res.status(201).json({ data: trip });
  } catch (err) {
    next(err);
  }
}

export async function createTripPhase1Handler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get user from auth middleware (if available)
    const userId = req.user?.userId;
    
    const result = await createTripPhase1({
      ...req.body,
      createdBy: userId,
    });
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function driverAcceptTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = req.params.id;
    // Get driverId from body or query (for now, later from auth token)
    const driverId = (req.body.driverId || req.query.driverId) as string;
    
    if (!driverId) {
      return res.status(400).json({
        error: "driverId is required",
      });
    }

    const updated = await driverAcceptTrip(tripId, driverId);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function driverRejectTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = req.params.id;
    const { driverId } = req.body;
    const updated = await driverRejectTrip(tripId, driverId);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function generateStartOtpHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = req.params.id;
    // Get driverId from body or query (for now, later from auth token)
    const driverId = (req.body.driverId || req.query.driverId) as string;
    
    if (!driverId) {
      return res.status(400).json({
        error: "driverId is required",
      });
    }

    const result = await generateStartOtpForTrip(tripId, driverId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function startTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = req.params.id;
    // Get driverId from body or query (for now, later from auth token)
    const driverId = (req.body.driverId || req.query.driverId) as string;
    const { otp } = req.body;
    
    if (!driverId) {
      return res.status(400).json({
        error: "driverId is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        error: "otp is required",
      });
    }

    const { odometerValue, carImageFront, carImageBack } = req.body;

    if (odometerValue === undefined || odometerValue === null) {
      return res.status(400).json({
        error: "odometerValue is required",
      });
    }

    if (!carImageFront) {
      return res.status(400).json({
        error: "carImageFront is required",
      });
    }

    if (!carImageBack) {
      return res.status(400).json({
        error: "carImageBack is required",
      });
    }

    const updated = await startTripWithOtp(tripId, {
      driverId,
      otp,
      odometerValue: parseFloat(odometerValue),
      carImageFront,
      carImageBack,
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function generateEndOtpHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = req.params.id;
    // Get driverId from body or query (for now, later from auth token)
    const driverId = (req.body.driverId || req.query.driverId) as string;
    
    if (!driverId) {
      return res.status(400).json({
        error: "driverId is required",
      });
    }

    const result = await generateEndOtpForTrip(tripId, driverId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function endTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = req.params.id;
    // Get driverId from body or query (for now, later from auth token)
    const driverId = (req.body.driverId || req.query.driverId) as string;
    const {
      otp,
      finalAmount,
      paymentStatus,
      paymentMode,
      paymentReference,
      overrideReason,
      odometerValue,
    } = req.body;

    if (!driverId) {
      return res.status(400).json({
        error: "driverId is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        error: "otp is required",
      });
    }

    if (odometerValue === undefined || odometerValue === null) {
      return res.status(400).json({
        error: "odometerValue is required",
      });
    }

    const updated = await endTripWithOtp(tripId, {
      driverId,
      otp,
      finalAmount,
      paymentStatus,
      paymentMode,
      paymentReference,
      overrideReason,
      odometerValue: parseFloat(odometerValue),
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function getAvailableDriversForTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const availableDrivers = await getAvailableDriversForTrip(id);
    res.json({ data: availableDrivers });
  } catch (err) {
    next(err);
  }
}

/**
 * Get trips assigned to the authenticated driver
 */
export async function getDriverAssignedTripsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get driverId from request body or query (for now, later from auth token)
    const driverId = (req.body.driverId || req.query.driverId) as string;
    
    if (!driverId) {
      return res.status(400).json({
        error: "driverId is required",
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(driverId)) {
      return res.status(400).json({
        error: "Invalid driver ID format. Expected UUID.",
      });
    }

    const trips = await getDriverAssignedTrips(driverId);
    res.json({ data: trips });
  } catch (err) {
    next(err);
  }
}

export async function assignDriverToTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    const userId = req.user?.userId; // Get from auth middleware if available
    if (!driverId) {
      const err: any = new Error("Driver ID is required");
      err.statusCode = 400;
      throw err;
    }
    const trip = await assignDriverToTrip(id, driverId, userId);
    res.json({ data: trip });
  } catch (err) {
    next(err);
  }
}
