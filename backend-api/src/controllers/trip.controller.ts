import { Request, Response, NextFunction } from "express";
import {
  listTrips,
  listTripsFiltered,
  getTrip,
  createTrip,
  createTripPhase1,
  driverAcceptTrip,
  driverRejectTrip,
  rescheduleTrip,
  cancelTrip,
  reassignDriverToTrip,
  generateStartOtpForTrip,
  startTripWithOtp,
  listUnassignedTrips,
  listTripsPaginated,
  listUnassignedTripsPaginated,
  getAvailableDriversForTrip,
  assignDriverToTrip,
  getDriverAssignedTrips,
  getDriverTripsAllStatuses,
  getAssignedTrips,
  getAssignedTripsPaginated,
  initiateStartTrip,
  verifyAndStartTrip,
  initiateEndTrip,
  verifyAndEndTrip,
  collectPayment,
  verifyPaymentAndEndTrip,
  getTripHistory,
  endTripDirect,
  updateTripLiveLocation,
} from "../services/trip.service";
import { PaymentStatus, PaymentMode } from "@prisma/client";
import { requireValidUUID, validateAndGetUUID } from "../utils/validation";
import { tripDispatchService } from "../services/tripDispatch.service";

function parseTripFilters(q: Record<string, unknown>): import("../repositories/trip.repository").TripFilters | undefined {
  const dateFrom = typeof q.dateFrom === "string" ? q.dateFrom.trim() || undefined : undefined;
  const dateTo = typeof q.dateTo === "string" ? q.dateTo.trim() || undefined : undefined;
  const status = typeof q.status === "string" ? q.status.trim() || undefined : undefined;
  const statuses = typeof q.statuses === "string"
    ? q.statuses.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  const franchiseId = typeof q.franchiseId === "string" ? q.franchiseId.trim() || undefined : undefined;
  if (!dateFrom && !dateTo && !status && !statuses?.length && !franchiseId) return undefined;
  return {
    dateFrom,
    dateTo,
    status: statuses?.length ? undefined : status,
    statuses: statuses?.length ? statuses : undefined,
    franchiseId,
  };
}

export async function getTrips(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filters = parseTripFilters(req.query as Record<string, unknown>);

    if (req.query.page || req.query.limit) {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

      if (page < 1 || limit < 1) {
        return res.status(400).json({
          error: "Page and limit must be positive numbers",
        });
      }

      const result = await listTripsPaginated({ page, limit }, filters);
      res.json(result);
    } else {
      // Backward compatible: no pagination means return array.
      // But if filters are provided (e.g. status/statuses/date range), apply them.
      const data = filters ? await listTripsFiltered(filters) : await listTrips();
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

/**
 * Get all assigned trips (trips that have a driver assigned)
 * Supports optional pagination and franchise filtering
 */
export async function getAssignedTripsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const franchiseId = req.query.franchiseId as string | undefined;
    
    // Check if pagination parameters are provided
    if (req.query.page || req.query.limit) {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 per page
      
      if (page < 1 || limit < 1) {
        return res.status(400).json({
          error: "Page and limit must be positive numbers",
        });
      }

      const result = await getAssignedTripsPaginated({ page, limit }, franchiseId);
      res.json(result);
    } else {
      // Return all assigned trips if no pagination params
      const data = await getAssignedTrips(franchiseId);
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
    const id = validateAndGetUUID(req.params.id, "Trip ID");
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
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    // Get driverId from body or query (for now, later from auth token)
    const driverId = validateAndGetUUID(
      (req.body.driverId || req.query.driverId) as string,
      "Driver ID"
    );

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
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const driverId = validateAndGetUUID(req.body.driverId, "Driver ID");
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
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const driverId = validateAndGetUUID(
      (req.body.driverId || req.query.driverId) as string,
      "Driver ID"
    );

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
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const driverId = validateAndGetUUID(
      (req.body.driverId || req.query.driverId) as string,
      "Driver ID"
    );
    const { otp } = req.body;

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
      driverId: driverId,
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

export async function getAvailableDriversForTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = validateAndGetUUID(req.params.id, "Trip ID");
    const availableDrivers = await getAvailableDriversForTrip(id);
    res.json({ data: availableDrivers });
  } catch (err) {
    next(err);
  }
}

/**
 * Get available drivers for a trip sorted by rating and suitability
 * GET /trip/:id/available
 */
export async function getAvailableDriversSortedByRatingHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = validateAndGetUUID(req.params.id, "Trip ID");
    const { getAvailableDriversSortedByRating } = await import("../services/trip.service");
    const result = await getAvailableDriversSortedByRating(id);
    res.json({ data: result });
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
    // Get driverId from query parameter or request body (for now, later from auth token)
    const driverId = (req.query?.driverId || req.body?.driverId) as string;
    
    if (!driverId) {
      return res.status(400).json({
        error: "driverId is required",
      });
    }

    // Validate UUID format
    requireValidUUID(driverId, "Driver ID");

    const trips = await getDriverAssignedTrips(driverId);
    res.json({ data: trips });
  } catch (err) {
    next(err);
  }
}

/**
 * Get trips assigned to the authenticated driver (uses driver ID from token)
 */
export async function getMyAssignedTripsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get driverId from authenticated driver token
    const driverId = req.driver?.driverId;
    
    if (!driverId) {
      return res.status(401).json({
        error: "Driver authentication required. Please login as a driver.",
      });
    }

    const trips = await getDriverAssignedTrips(driverId);
    res.json({ data: trips });
  } catch (err) {
    next(err);
  }
}

/**
 * Get ALL trips for the authenticated driver (includes completed/cancelled).
 *
 * Why separate from `/trips/my-assigned`?
 * - `/trips/my-assigned` is used by the Home tab + realtime "upcoming trips" UX and must stay active-only.
 * - Trips tab needs history, so it uses this endpoint.
 */
export async function getMyTripsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.driver?.driverId;

    if (!driverId) {
      return res.status(401).json({
        error: "Driver authentication required. Please login as a driver.",
      });
    }

    const trips = await getDriverTripsAllStatuses(driverId);
    res.json({ data: trips });
  } catch (err) {
    next(err);
  }
}

/**
 * Initiate trip start - generates token and sends OTP to customer.
 * Trip ID from URL only; driverId and franchiseId are derived from the trip.
 * Body: odometerValue, odometerPic, carFrontPic, carBackPic only.
 */
export async function initiateStartTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const { odometerValue, odometerPic, carFrontPic, carBackPic, driverSelfie, startTime } = req.body;

    if (odometerValue === undefined || odometerValue === null) {
      return res.status(400).json({
        error: "odometerValue is required",
      });
    }

    if (!odometerPic) {
      return res.status(400).json({
        error: "odometerPic is required",
      });
    }

    if (!carFrontPic) {
      return res.status(400).json({
        error: "carFrontPic is required",
      });
    }

    if (!carBackPic) {
      return res.status(400).json({
        error: "carBackPic is required",
      });
    }

    if (!driverSelfie) {
      return res.status(400).json({
        error: "driverSelfie is required",
      });
    }

    if (!startTime) {
      return res.status(400).json({
        error: "startTime is required",
      });
    }

    const result = await initiateStartTrip({
      tripId,
      odometerValue: parseFloat(odometerValue),
      odometerPic,
      carFrontPic,
      carBackPic,
      driverSelfie,
      startTime: new Date(startTime),
    });

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify token and OTP, then start the trip
 */
export async function verifyAndStartTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = validateAndGetUUID(req.params.id, "Trip ID");
    const { token, otp } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "token is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        error: "otp is required",
      });
    }

    const trip = await verifyAndStartTrip({
      tripId: id,
      token,
      otp,
    });

    res.json({ data: trip });
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
    const id = validateAndGetUUID(req.params.id, "Trip ID");
    const driverId = validateAndGetUUID(req.body.driverId, "Driver ID");
    const userId = req.user?.userId; // Get from auth middleware if available
    const trip = await assignDriverToTrip(id, driverId, userId);
    res.json({ data: trip });
  } catch (err) {
    next(err);
  }
}

export async function assignDriverToTripWithFranchiseHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.body.tripId, "Trip ID");
    const driverId = validateAndGetUUID(req.body.driverId, "Driver ID");
    const userId = req.user?.userId; // Get from auth middleware if available

    // Franchise is derived from the trip inside assignDriverToTrip
    const trip = await assignDriverToTrip(tripId, driverId, userId);
    res.json({ data: trip });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /trips/:id/request-drivers
 * Manually trigger trip offers to drivers (ALL / SPECIFIC / LIST).
 *
 * Note: Phase-1 booking already starts dispatch automatically; this endpoint is for
 * "request now" / "request specific driver" flows from the dispatcher UI.
 */
export async function requestTripDriversHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const body = req.body as {
      mode?: "ALL" | "SPECIFIC" | "LIST";
      driverId?: string;
      driverIds?: string[];
    };

    const mode = body.mode ?? "ALL";

    if (mode === "SPECIFIC" && body.driverId) {
      const result = await tripDispatchService.requestTripToEligibleDriverNow(tripId, body.driverId);
      return res.json({ data: result });
    }

    if (mode === "LIST" && Array.isArray(body.driverIds)) {
      const result = await tripDispatchService.requestTripToEligibleDriversNow(tripId, body.driverIds);
      return res.json({ data: result });
    }

    const result = await tripDispatchService.requestTripToAllEligibleDriversNow(tripId);
    return res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Initiate trip end - generates OTP and sends to customer.
 * Trip ID from URL only; driverId and franchiseId are derived from the trip.
 * Body: odometerValue, odometerImage only.
 */
export async function initiateEndTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const { odometerValue, odometerImage, endTime } = req.body;

    if (odometerValue === undefined || odometerValue === null) {
      return res.status(400).json({
        error: "odometerValue is required",
      });
    }

    if (!odometerImage) {
      return res.status(400).json({
        error: "odometerImage is required",
      });
    }

    if (!endTime) {
      return res.status(400).json({
        error: "endTime is required",
      });
    }

    const result = await initiateEndTrip({
      tripId,
      odometerValue: parseFloat(odometerValue),
      odometerImage,
      endTime: new Date(endTime),
    });

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify OTP and end trip - calculates distance, time, and amount
 */
export async function verifyAndEndTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const { token, otp } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "token is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        error: "otp is required",
      });
    }

    const result = await verifyAndEndTrip({
      tripId,
      token,
      otp,
    });

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Collect payment information from customer
 */
export async function collectPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const { driverId, paymentMethod, upiAmount, cashAmount, upiReference } = req.body;

    if (!driverId) {
      return res.status(400).json({
        error: "driverId is required",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        error: "paymentMethod is required. Must be UPI, CASH, or BOTH",
      });
    }

    if (paymentMethod !== "UPI" && paymentMethod !== "CASH" && paymentMethod !== "BOTH") {
      return res.status(400).json({
        error: "Invalid paymentMethod. Must be UPI, CASH, or BOTH",
      });
    }

    const result = await collectPayment({
      tripId,
      driverId,
      paymentMethod,
      upiAmount: upiAmount ? parseFloat(upiAmount) : undefined,
      cashAmount: cashAmount ? parseFloat(cashAmount) : undefined,
      upiReference,
    });

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify payment and end trip - sends email with review form
 */
export async function verifyPaymentAndEndTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const driverId = validateAndGetUUID(req.body.driverId, "Driver ID");

    const result = await verifyPaymentAndEndTrip({
      tripId,
      driverId,
    });

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Get trip history for a driver
 */
export async function getTripHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const driverId = validateAndGetUUID(
      (req.driver?.driverId || req.body.driverId || req.query.driverId) as string,
      "Driver ID"
    );

    const result = await getTripHistory(tripId, driverId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * End trip directly with price calculation (testing endpoint)
 */
export async function endTripDirectHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const { driverId, endOdometer, endTime, carImageFront, carImageBack } = req.body;

    if (!driverId) {
      return res.status(400).json({
        error: "driverId is required",
      });
    }

    if (!endOdometer && endOdometer !== 0) {
      return res.status(400).json({
        error: "endOdometer is required",
      });
    }

    const result = await endTripDirect({
      tripId,
      driverId: validateAndGetUUID(driverId, "Driver ID"),
      endOdometer: parseFloat(endOdometer),
      endTime: endTime ? new Date(endTime) : undefined,
      carImageFront,
      carImageBack,
    });

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Get trip activity logs (for admin/staff view)
 */
export async function getTripLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const { getActivityLogsByTripId } = await import("../repositories/activity.repository");
    const activityLogs = await getActivityLogsByTripId(tripId);
    res.json({ data: activityLogs });
  } catch (err) {
    next(err);
  }
}

/**
 * Reschedule a trip (update scheduled date/time)
 */
export async function rescheduleTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const { tripDate, tripTime } = req.body;
    const updated = await rescheduleTrip(tripId, { tripDate, tripTime });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel a trip
 */
export async function cancelTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const { cancelledBy, reason } = req.body;
    const updated = await cancelTrip(tripId, { cancelledBy, reason });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * Reassign driver to a trip
 */
export async function reassignDriverToTripHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const driverId = validateAndGetUUID(req.body.driverId, "Driver ID");
    const franchiseId = req.body.franchiseId
      ? validateAndGetUUID(req.body.franchiseId, "Franchise ID")
      : undefined;
    const userId = req.user?.userId;
    const updated = await reassignDriverToTrip(
      tripId,
      { driverId, franchiseId },
      userId
    );
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * Update trip live location from driver
 */
export async function updateTripLiveLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = validateAndGetUUID(req.params.id, "Trip ID");
    const { lat, long } = req.body;

    if (lat === undefined || lat === null) {
      return res.status(400).json({
        error: "lat is required",
      });
    }

    if (long === undefined || long === null) {
      return res.status(400).json({
        error: "long is required",
      });
    }

    // Validate lat/long ranges
    const latitude = parseFloat(lat);
    const longitude = parseFloat(long);

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        error: "lat must be between -90 and 90",
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: "long must be between -180 and 180",
      });
    }

    const result = await updateTripLiveLocation({
      tripId,
      lat: latitude,
      long: longitude,
    });

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
