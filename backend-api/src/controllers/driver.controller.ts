// src/controllers/driver.controller.ts
import { Request, Response, NextFunction } from "express";
import { listDrivers, listDriversPaginated, getDriver, getDriverWithPerformance, getAvailableGreenDriversList, getAvailableDriversList, getDriversByFranchises, createDriver, loginDriver, updateDriver, updateDriverStatus, softDeleteDriver } from "../services/driver.service";
import { calculateDriverPerformance } from "../services/driver-performance.service";
import { DriverLoginDTO, UpdateDriverDTO, UpdateDriverStatusDTO } from "../types/driver.dto";
import { DriverEmploymentType } from "@prisma/client";
import { submitCashToCompany, submitCashForSettlement, getDriverDailyLimit } from "../services/driverCash.service";
import { SubmitCashForSettlementDTO } from "../types/driver.dto";
import { updateMyDriverLocation, getLiveLocations } from "../services/driverLocation.service";
import { getDriverMonthlyStats, getDriverTotalEarnings } from "../services/driverEarnings.service";

export async function getDrivers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const franchiseId = req.query.franchiseId as string | undefined;
    const includePerformance = req.query.includePerformance === "true";
    
    const employmentTypeStr = req.query.employmentType as string | undefined;
    let employmentType: DriverEmploymentType | undefined;
    if (employmentTypeStr && Object.values(DriverEmploymentType).includes(employmentTypeStr as DriverEmploymentType)) {
      employmentType = employmentTypeStr as DriverEmploymentType;
    }
    
    // Check if pagination query parameters are provided
    // Use validated query from middleware (type-safe)
    const validatedQuery = (req as any).validatedQuery;
    if (validatedQuery && (validatedQuery.page || validatedQuery.limit)) {
      const result = await listDriversPaginated(
        { ...validatedQuery, franchiseId, employmentType },
        includePerformance
      );
      res.json(result);
    } else {
      // Backward compatibility: return all drivers if no pagination params
      const data = await listDrivers(franchiseId, includePerformance, employmentType);
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

export async function getDriverById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string; // UUID string
    const driver = await getDriver(id);
    res.json({ data: driver });
  } catch (err) {
    next(err);
  }
}

export async function getDriverWithPerformanceHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const driver = await getDriverWithPerformance(id);
    res.json({ data: driver });
  } catch (err) {
    next(err);
  }
}

export async function getDriverPerformanceHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const performance = await calculateDriverPerformance(id);
    res.json({ data: performance });
  } catch (err) {
    next(err);
  }
}

export async function createDriverHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const createdBy = req.user?.userId;
    const result = await createDriver(req.body, createdBy);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function loginDriverHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await loginDriver(req.body as DriverLoginDTO);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateDriverHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string; // UUID string
    const result = await updateDriver(id, req.body as UpdateDriverDTO);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateDriverStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string; // UUID string
    const result = await updateDriverStatus(id, req.body as UpdateDriverStatusDTO);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function softDeleteDriverHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string; // UUID string
    const result = await softDeleteDriver(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAvailableGreenDriversHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const franchiseId = req.query.franchiseId as string | undefined;
    const drivers = await getAvailableGreenDriversList(franchiseId);
    res.json({ data: drivers });
  } catch (err) {
    next(err);
  }
}

/**
 * Get drivers for trip assignment (all franchise drivers, best first)
 * Returns all ACTIVE drivers. Sorted by: AVAILABLE first, then day limit not finished, then performance (GREEN > YELLOW > RED), then score.
 */
export async function getAvailableDriversHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const franchiseId = req.query.franchiseId as string | undefined;
    const drivers = await getAvailableDriversList(franchiseId);
    res.json({ data: drivers });
  } catch (err) {
    next(err);
  }
}

export async function getDriversByFranchisesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get franchiseIds from query parameter (can be comma-separated or array)
    let franchiseIds: string[] = [];
    
    if (req.query.franchiseIds) {
      if (Array.isArray(req.query.franchiseIds)) {
        franchiseIds = req.query.franchiseIds as string[];
      } else {
        // Handle comma-separated string
        franchiseIds = (req.query.franchiseIds as string).split(",").map((id) => id.trim());
      }
    } else if (req.query.franchiseId) {
      // Support single franchiseId for backward compatibility
      franchiseIds = [req.query.franchiseId as string];
    } else {
      return res.status(400).json({
        error: "franchiseIds or franchiseId query parameter is required",
      });
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = franchiseIds.filter((id) => !uuidRegex.test(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: "Invalid franchise ID format",
        invalidIds,
      });
    }

    const drivers = await getDriversByFranchises(franchiseIds);
    res.json({ data: drivers });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit cash to company (reset cash in hand to zero)
 */
export async function submitCashToCompanyHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await submitCashToCompany(id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Get driver daily limit information
 */
export async function getDriverDailyLimitHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await getDriverDailyLimit(id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit cash for settlement (reduce cash in hand by specified amount)
 */
export async function submitCashForSettlementHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { driverId, settlementAmount } = req.body as SubmitCashForSettlementDTO;
    const result = await submitCashForSettlement(driverId, settlementAmount);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Update authenticated driver's live GPS location
 * POST /drivers/me/location
 */
export async function updateMyDriverLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.driver?.driverId;
    if (!driverId) {
      return res.status(401).json({ error: "Driver authentication required" });
    }

    const updated = await updateMyDriverLocation(driverId, req.body);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * Get live location of all drivers
 * GET /drivers/live-location
 */
export async function getDriversLiveLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const franchiseId = req.query.franchiseId as string | undefined;
    const locations = await getLiveLocations(franchiseId);
    res.json({ data: locations });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /drivers/me/profile
 * Driver profile summary for mobile (driver token required).
 * Includes total + monthly earnings.
 */
export async function getMyDriverProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const driverId = req.driver?.driverId;
    if (!driverId) {
      return res.status(401).json({ error: "Driver authentication required" });
    }

    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;

    const [profile, total, monthly] = await Promise.all([
      getDriver(driverId),
      getDriverTotalEarnings(driverId),
      getDriverMonthlyStats(driverId, year, month),
    ]);

    res.json({
      data: {
        ...profile,
        earnings: {
          totalEarnings: total.totalEarnings,
          month: monthly.month,
          year: monthly.year,
          monthlyEarnings: monthly.monthlyEarnings,
          tripsCount: monthly.tripsCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
