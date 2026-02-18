// src/controllers/franchise.controller.ts
import { Request, Response, NextFunction } from "express";
import prisma from "../config/prismaClient";
import {
  listFranchises,
  listFranchisesPaginated,
  getFranchise,
  getMyFranchise,
  createFranchise,
  updateFranchise,
  updateFranchiseStatus,
  deleteFranchise,
} from "../services/franchise.service";
import {
  CreateFranchiseDTO,
  UpdateFranchiseDTO,
  UpdateFranchiseStatusDTO,
  ListFranchisesQueryDTO,
} from "../types/franchise.dto";

export async function getFranchises(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Check if pagination/search/filter query parameters are provided
    if (req.query.page || req.query.limit || req.query.search || req.query.status) {
      // Use validated query (parsed and transformed by middleware)
      const query = (req as any).validatedQuery as ListFranchisesQueryDTO;
      const result = await listFranchisesPaginated(query);
      return res.json(result);
    } else {
      // Backward compatibility: return all franchises if no pagination params
      const result = await listFranchises();
      return res.json({
        success: true,
        message: "Franchises retrieved successfully",
        data: result.data,
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function getFranchiseById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // ADMIN can access any franchise
    if (user.role === "ADMIN") {
      const result = await getFranchise(id);
      return res.json(result);
    }

    // For non-ADMIN users, get their franchiseId and enforce isolation
    let userFranchiseId: string | null = null;

    if (user.role === "MANAGER") {
      // Use franchiseId from JWT token (set during login)
      userFranchiseId = user.franchiseId ?? null;

      // Fallback: query database if franchiseId not in token
      if (!userFranchiseId) {
        const userRecord = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { franchiseId: true },
        });
        userFranchiseId = userRecord?.franchiseId ?? null;
      }
    } else if (user.role === "STAFF" || user.role === "OFFICE_STAFF") {
      // Get franchiseId from Staff table
      const staff = await prisma.staff.findUnique({
        where: { email: user.email },
        select: { franchiseId: true },
      });
      userFranchiseId = staff?.franchiseId ?? null;
    } else if (user.role === "DRIVER") {
      // Get franchiseId from Driver table
      const driver = await prisma.driver.findUnique({
        where: { email: user.email },
        select: { franchiseId: true },
      });
      userFranchiseId = driver?.franchiseId ?? null;
    }

    // Check if user is associated with any franchise
    if (!userFranchiseId) {
      return res.status(400).json({
        success: false,
        message: "User is not associated with any franchise",
      });
    }

    // Enforce franchise isolation - user can only access their own franchise
    if (id !== userFranchiseId) {
      return res.status(403).json({
        success: false,
        message: "Access denied - you can only access your own franchise details",
      });
    }

    const result = await getFranchise(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMyFranchiseHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // For ADMIN, get first active franchise (they manage all)
    // For MANAGER, franchiseId should be in JWT token (req.user.franchiseId)
    // For STAFF/OFFICE_STAFF, get franchiseId from Staff table
    // For DRIVER, get franchiseId from Driver table
    
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    let franchiseId: string | null = null;
    
    if (user.role === "ADMIN") {
      // ADMIN users can access any franchise - return the first active one
      // or use franchiseId from token if available
      franchiseId = user.franchiseId ?? null;
      
      // Fallback: get first active franchise
      if (!franchiseId) {
        const firstFranchise = await prisma.franchise.findFirst({
          where: { isActive: true },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        franchiseId = firstFranchise?.id ?? null;
      }
    } else if (user.role === "MANAGER") {
      // Use franchiseId from JWT token (set during login)
      franchiseId = user.franchiseId ?? null;
      
      // Fallback: query database if franchiseId not in token
      if (!franchiseId) {
        const userRecord = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { franchiseId: true },
        });
        franchiseId = userRecord?.franchiseId ?? null;
      }
    } else if (user.role === "STAFF" || user.role === "OFFICE_STAFF") {
      // Get franchiseId from Staff table
      const staff = await prisma.staff.findUnique({
        where: { email: user.email },
        select: { franchiseId: true },
      });
      franchiseId = staff?.franchiseId ?? null;
    } else if (user.role === "DRIVER") {
      // Get franchiseId from Driver table
      const driver = await prisma.driver.findUnique({
        where: { email: user.email },
        select: { franchiseId: true },
      });
      franchiseId = driver?.franchiseId ?? null;
    }
    
    if (!franchiseId) {
      return res.status(400).json({
        success: false,
        message: "User is not associated with any franchise",
      });
    }

    const result = await getMyFranchise(franchiseId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createFranchiseHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await createFranchise(req.body as CreateFranchiseDTO);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateFranchiseHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await updateFranchise(id, req.body as UpdateFranchiseDTO);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateFranchiseStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await updateFranchiseStatus(id, req.body as UpdateFranchiseStatusDTO);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteFranchiseHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await deleteFranchise(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
