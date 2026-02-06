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
 * @swagger
 * /penalties:
 *   post:
 *     tags:
 *       - Penalties
 *     summary: Create a new penalty deduction type
 *     description: Create a new penalty/deduction type with name, amount, and description (Admin/Manager only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Late report"
 *               description:
 *                 type: string
 *                 example: "Penalty for reporting late to work"
 *               amount:
 *                 type: integer
 *                 example: 100
 *               type:
 *                 type: string
 *                 enum: [PENALTY, DEDUCTION]
 *                 default: PENALTY
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Penalty created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Manager only
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
 * @swagger
 * /penalties:
 *   get:
 *     tags:
 *       - Penalties
 *     summary: Get all penalty deduction types
 *     description: Retrieve all penalty types with optional filtering
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PENALTY, DEDUCTION]
 *         description: Filter by penalty type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of penalties
 *       401:
 *         description: Unauthorized
 */
export async function getPenaltiesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
   @swagger
 * /penalties/{id}:
 *   patch:
 *     tags:
 *       - Penalties
 *     summary: Update a penalty deduction type
 *     description: Update penalty details like name, amount, or description (Admin/Manager only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Penalty ID
 *     requestBody:
 * @swagger
 * /penalties/{id}:
 *   delete:
 *     tags:
 *       - Penalties
 *     summary: Delete a penalty deduction type
 *     description: Soft delete a penalty type by setting isActive to false (Admin/Manager only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Penalty ID
 *     responses:
 *       200:
 *         description: Penalty deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Penalty not found: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Penalty updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Penalty not found.page || req.query.limit) {
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
