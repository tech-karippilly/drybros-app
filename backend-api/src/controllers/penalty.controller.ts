// src/controllers/penalty.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  createPenalty,
  getPenalties,
  getPenaltiesPaginated,
  getPenalty,
  updatePenalty,
  deletePenalty,
  applyPenaltyToDriver,
  applyPenaltyToDrivers,
  getDriverPenalties,
  getDriverPenaltiesPaginated,
  getDriverPenalty,
  updateDriverPenalty,
  deleteDriverPenalty,
} from "../services/penalty.service";
import { setDriverDailyLimit, setDriversDailyLimit } from "../services/driverLimit.service";
import { UserRole } from "@prisma/client";
import prisma from "../config/prismaClient";

/**
 * Create penalty
 */
export async function createPenaltyHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = req.body;
    const result = await createPenalty(input);
    res.status(201).json({ message: "Penalty created successfully", data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all penalties
 */
export async function getPenaltiesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.query.page || req.query.limit) {
      const pagination = (req as any).validatedQuery;
      const result = await getPenaltiesPaginated(pagination);
      res.json(result);
    } else {
      const validatedQuery = (req as any).validatedQuery;
      const filters: any = {};
      if (validatedQuery?.isActive !== undefined) filters.isActive = validatedQuery.isActive;
      if (validatedQuery?.type) filters.type = validatedQuery.type;
      const data = await getPenalties(filters);
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Get penalty by ID
 */
export async function getPenaltyByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const penalty = await getPenalty(id);
    res.json({ data: penalty });
  } catch (err) {
    next(err);
  }
}

/**
 * Update penalty
 */
export async function updatePenaltyHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const input = req.body;
    const result = await updatePenalty(id, input);
    res.json({ message: "Penalty updated successfully", data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete penalty
 */
export async function deletePenaltyHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    await deletePenalty(id);
    res.json({ message: "Penalty deleted successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * Apply penalty to a single driver
 */
export async function applyPenaltyToDriverHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.params.driverId;
    const input = req.body;
    const user = req.user;
    const result = await applyPenaltyToDriver(driverId, input, user?.userId);
    res.status(201).json({ message: "Penalty applied successfully", data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Apply penalty to multiple drivers
 */
export async function applyPenaltyToDriversHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = req.body;
    const user = req.user;
    const result = await applyPenaltyToDrivers(input, user?.userId);
    res.status(201).json({ message: `Penalty applied to ${result.length} driver(s)`, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Get driver penalties
 */
export async function getDriverPenaltiesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.query.page || req.query.limit) {
      const pagination = (req as any).validatedQuery;
      const result = await getDriverPenaltiesPaginated(pagination);
      res.json(result);
    } else {
      const validatedQuery = (req as any).validatedQuery;
      const filters: any = {};
      if (validatedQuery?.driverId) filters.driverId = validatedQuery.driverId;
      if (validatedQuery?.penaltyId) filters.penaltyId = validatedQuery.penaltyId;
      if (validatedQuery?.startDate) filters.startDate = new Date(validatedQuery.startDate);
      if (validatedQuery?.endDate) filters.endDate = new Date(validatedQuery.endDate);
      const data = await getDriverPenalties(filters);
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Get driver penalty by ID
 */
export async function getDriverPenaltyByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const driverPenalty = await getDriverPenalty(id);
    res.json({ data: driverPenalty });
  } catch (err) {
    next(err);
  }
}

/**
 * Update driver penalty
 */
export async function updateDriverPenaltyHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const input = req.body;
    const result = await updateDriverPenalty(id, input);
    res.json({ message: "Driver penalty updated successfully", data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete driver penalty
 */
export async function deleteDriverPenaltyHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    await deleteDriverPenalty(id);
    res.json({ message: "Driver penalty deleted successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * Set daily limit for a specific driver
 */
export async function setDriverDailyLimitHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.params.driverId;
    const input = req.body;
    const result = await setDriverDailyLimit(driverId, input);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Set daily limit for multiple drivers
 */
export async function setDriversDailyLimitHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = req.body;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get user's franchiseId if MANAGER role
    let userFranchiseId: string | undefined;
    if (user.role === UserRole.MANAGER) {
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { franchiseId: true },
      });
      userFranchiseId = userRecord?.franchiseId || undefined;
    }

    const result = await setDriversDailyLimit(input, user.role, userFranchiseId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
