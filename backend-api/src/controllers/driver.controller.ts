// src/controllers/driver.controller.ts
import { Request, Response, NextFunction } from "express";
import { listDrivers, listDriversPaginated, getDriver, getDriverWithPerformance, getAvailableGreenDriversList, getDriversByFranchises, createDriver, loginDriver, updateDriver, updateDriverStatus, softDeleteDriver } from "../services/driver.service";
import { calculateDriverPerformance } from "../services/driver-performance.service";
import { DriverLoginDTO, UpdateDriverDTO, UpdateDriverStatusDTO } from "../types/driver.dto";

export async function getDrivers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const franchiseId = req.query.franchiseId as string | undefined;
    const includePerformance = req.query.includePerformance === "true";
    
    // Check if pagination query parameters are provided
    // Use validated query from middleware (type-safe)
    const validatedQuery = (req as any).validatedQuery;
    if (validatedQuery && (validatedQuery.page || validatedQuery.limit)) {
      const result = await listDriversPaginated(
        { ...validatedQuery, franchiseId },
        includePerformance
      );
      res.json(result);
    } else {
      // Backward compatibility: return all drivers if no pagination params
      const data = await listDrivers(franchiseId, includePerformance);
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
    const id = req.params.id; // UUID string
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
    const { id } = req.params;
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
    const { id } = req.params;
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
    const id = req.params.id; // UUID string
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
    const id = req.params.id; // UUID string
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
    const id = req.params.id; // UUID string
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
