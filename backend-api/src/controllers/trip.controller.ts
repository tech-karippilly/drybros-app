import { Request, Response, NextFunction } from "express";
import {
  listTrips,
  getTripById,
  createTrip,
  assignDriver,
  reassignDriver,
  rescheduleTrip,
  cancelTrip,
  startTrip,
  endTrip,
  collectPayment,
  getDriverTrips,
} from "../services/trip.service";
import { TripFilters } from "../repositories/trip.repository";

// ============================================
// 1. CREATE TRIP
// ============================================

export async function createTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId!;
    const userRole = req.user?.role!;

    const result = await createTrip(req.body, userId, userRole);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 2. LIST TRIPS
// ============================================

export async function getTripsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { franchiseId, driverId, status, dateFrom, dateTo, page, limit } = req.query;
    
    // For DRIVER role, filter by their own driverId
    let finalDriverId = driverId as string | undefined;
    if (req.user?.role === "DRIVER" && req.driver?.driverId) {
      finalDriverId = req.driver.driverId;
    }

    const filters: TripFilters = {
      franchiseId: franchiseId as string,
      driverId: finalDriverId,
      status: status as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    };

    const pagination = page && limit
      ? { page: parseInt(page as string, 10), limit: parseInt(limit as string, 10) }
      : undefined;

    const result = await listTrips(filters, pagination);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 3. GET TRIP BY ID
// ============================================

export async function getTripByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await getTripById(req.params.id as string);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 4. ASSIGN DRIVER
// ============================================

export async function assignDriverHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId!;
    const tripId = req.params.id as string;

    const result = await assignDriver(tripId, req.body, userId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 5. REASSIGN DRIVER
// ============================================

export async function reassignDriverHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId!;
    const tripId = req.params.id as string;

    const result = await reassignDriver(tripId, req.body, userId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 6. RESCHEDULE TRIP
// ============================================

export async function rescheduleTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId!;
    const tripId = req.params.id as string;

    const result = await rescheduleTrip(tripId, req.body, userId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 7. CANCEL TRIP
// ============================================

export async function cancelTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId!;
    const tripId = req.params.id as string;

    const result = await cancelTrip(tripId, req.body, userId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 8. START TRIP (DRIVER ONLY)
// ============================================

export async function startTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.driver?.driverId;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Driver authentication required",
      });
    }

    const tripId = req.params.id as string;
    const result = await startTrip(tripId, req.body, driverId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 9. END TRIP (DRIVER ONLY)
// ============================================

export async function endTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.driver?.driverId;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Driver authentication required",
      });
    }

    const tripId = req.params.id as string;
    const result = await endTrip(tripId, req.body, driverId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// 10. COLLECT PAYMENT (DRIVER ONLY)
// ============================================

export async function collectPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.driver?.driverId;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Driver authentication required",
      });
    }

    const tripId = req.params.id as string;
    const result = await collectPayment(tripId, req.body, driverId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}
