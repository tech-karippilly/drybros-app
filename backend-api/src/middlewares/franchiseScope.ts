// src/middlewares/franchiseScope.ts
import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../config/prismaClient";

/**
 * Middleware to enforce franchise isolation for MANAGER role
 * ADMIN can access all franchises
 * MANAGER can only access their own franchise
 */
export async function enforceFranchiseScope(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: "Not authenticated" 
    });
  }

  // ADMIN can access all franchises
  if (user.role === UserRole.ADMIN) {
    return next();
  }

  // MANAGER can only access their own franchise
  if (user.role === UserRole.MANAGER) {
    try {
      // Get franchiseId from User table
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { franchiseId: true },
      });

      if (!userRecord?.franchiseId) {
        return res.status(400).json({
          success: false,
          message: "Manager is not associated with any franchise",
        });
      }

      // Override any query params to enforce scope
      req.query.franchiseId = userRecord.franchiseId;
      
      // Store in request for controller access
      (req as any).managerFranchiseId = userRecord.franchiseId;

      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to verify franchise access",
      });
    }
  }

  // Other roles denied
  return res.status(403).json({ 
    success: false, 
    message: "Forbidden" 
  });
}

/**
 * Middleware to validate driver belongs to manager's franchise
 * Used for driver-specific operations (update, status change, etc.)
 */
export async function validateDriverFranchiseAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: "Not authenticated" 
    });
  }

  // ADMIN can access all drivers
  if (user.role === UserRole.ADMIN) {
    return next();
  }

  // MANAGER can only access drivers from their franchise
  if (user.role === UserRole.MANAGER) {
    try {
      const driverId = req.params.id as string;
      
      if (!driverId) {
        return res.status(400).json({
          success: false,
          message: "Driver ID is required",
        });
      }

      // Get manager's franchiseId
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { franchiseId: true },
      });

      if (!userRecord?.franchiseId) {
        return res.status(400).json({
          success: false,
          message: "Manager is not associated with any franchise",
        });
      }

      // Check if driver belongs to manager's franchise
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { franchiseId: true },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }

      if (driver.franchiseId !== userRecord.franchiseId) {
        return res.status(403).json({
          success: false,
          message: "You can only manage drivers from your franchise",
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to verify franchise access",
      });
    }
  }

  // Other roles denied
  return res.status(403).json({ 
    success: false, 
    message: "Forbidden" 
  });
}

/**
 * Middleware to validate car belongs to driver in manager's franchise
 * Used for car-specific operations
 */
export async function validateCarFranchiseAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: "Not authenticated" 
    });
  }

  // ADMIN can access all cars
  if (user.role === UserRole.ADMIN) {
    return next();
  }

  // MANAGER can only access cars from their franchise drivers
  if (user.role === UserRole.MANAGER) {
    try {
      const carId = req.params.carId as string;
      
      if (!carId) {
        return res.status(400).json({
          success: false,
          message: "Car ID is required",
        });
      }

      // Get manager's franchiseId
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { franchiseId: true },
      });

      if (!userRecord?.franchiseId) {
        return res.status(400).json({
          success: false,
          message: "Manager is not associated with any franchise",
        });
      }

      // Check if car's driver belongs to manager's franchise
      // Query using raw SQL to avoid Prisma client regeneration issues
      const car: any = await prisma.$queryRaw`
        SELECT dc.id, d."franchiseId"
        FROM "DriverCar" dc
        INNER JOIN "Driver" d ON dc."driverId" = d.id
        WHERE dc.id = ${carId}::uuid
      `;

      if (!car || car.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Car not found",
        });
      }

      if (car[0].franchiseId !== userRecord.franchiseId) {
        return res.status(403).json({
          success: false,
          message: "You can only manage cars from your franchise drivers",
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to verify franchise access",
      });
    }
  }

  // Other roles denied
  return res.status(403).json({ 
    success: false, 
    message: "Forbidden" 
  });
}
