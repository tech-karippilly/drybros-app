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
} from "../services/trip.service";
import { PaymentStatus, PaymentMode } from "@prisma/client";

export async function getTrips(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listTrips();
    res.json({ data });
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
    const id = Number(req.params.id);
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
    const tripId = Number(req.params.id);
    const { driverId } = req.body; // later: from auth token
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
    const tripId = Number(req.params.id);
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
    const tripId = Number(req.params.id);
    const { driverId } = req.body;
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
    const tripId = Number(req.params.id);
    const { driverId, otp } = req.body;
    const updated = await startTripWithOtp(tripId, driverId, otp);
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
    const tripId = Number(req.params.id);
    const { driverId } = req.body;
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
    const tripId = Number(req.params.id);
    const {
      driverId,
      otp,
      finalAmount,
      paymentStatus,
      paymentMode,
      paymentReference,
      overrideReason,
    } = req.body;

    const updated = await endTripWithOtp(tripId, {
      driverId,
      otp,
      finalAmount,
      paymentStatus,
      paymentMode,
      paymentReference,
      overrideReason,
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}
