import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../config/prismaClient";

/**
 * Enforce franchise scope for MANAGER/OFFICE_STAFF on trip list queries.
 * ADMIN gets full access, MANAGER/OFFICE_STAFF get their franchise only.
 */
export async function enforceTripFranchiseScope(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = user.role;

    // ADMIN has full access - no franchise restriction
    if (userRole === UserRole.ADMIN) {
      return next();
    }

    // DRIVER - filter by their own trips (handled in controller)
    if (userRole === UserRole.DRIVER) {
      return next();
    }

    // MANAGER or OFFICE_STAFF - enforce franchise isolation
    if (userRole === UserRole.MANAGER || userRole === UserRole.OFFICE_STAFF) {
      // Get franchiseId from User table
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { franchiseId: true },
      });

      if (!userRecord || !userRecord.franchiseId) {
        return res.status(403).json({
          success: false,
          message: "User not associated with any franchise",
        });
      }

      // Override query parameter to enforce franchise scope
      req.query.franchiseId = userRecord.franchiseId;

      return next();
    }

    // Unknown role
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Validate that a specific trip belongs to the manager's franchise.
 * Used for single trip operations (GET /trips/:id, POST /trips/:id/assign, etc.)
 */
export async function validateTripFranchiseAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = user.role;

    // ADMIN has full access
    if (userRole === UserRole.ADMIN) {
      return next();
    }

    // Get tripId from params
    const tripId = req.params.id as string;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: "Trip ID is required",
      });
    }

    // DRIVER - validate they own this trip
    if (userRole === UserRole.DRIVER) {
      const driverId = req.driver?.driverId;

      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Driver authentication required",
        });
      }

      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { driverId: true },
      });

      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Trip not found",
        });
      }

      if (trip.driverId !== driverId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: This trip is not assigned to you",
        });
      }

      return next();
    }

    // MANAGER or OFFICE_STAFF - validate franchise
    if (userRole === UserRole.MANAGER || userRole === UserRole.OFFICE_STAFF) {
      // Get user's franchiseId
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { franchiseId: true },
      });

      if (!userRecord || !userRecord.franchiseId) {
        return res.status(403).json({
          success: false,
          message: "User not associated with any franchise",
        });
      }

      // Get trip's franchiseId
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { franchiseId: true },
      });

      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Trip not found",
        });
      }

      if (trip.franchiseId !== userRecord.franchiseId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Trip belongs to different franchise",
        });
      }

      return next();
    }

    // Unknown role
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions",
    });
  } catch (error) {
    next(error);
  }
}
