import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/authConfig";
import { UserRole } from "@prisma/client";

export interface AuthUser {
  userId: string;
  role: UserRole;
  fullName: string;
  email: string;
  franchiseId?: string;
}

export interface AuthDriver {
  driverId: string;
  driverCode: string;
  email: string;
  type: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      driver?: AuthDriver;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.substring("Bearer ".length);

  try {
    const payload = jwt.verify(token, authConfig.jwtSecret) as any;
    
    // Check if it's a driver token (has driverId)
    if (payload.driverId) {
      req.driver = payload as AuthDriver;
    } else {
      // It's a user token
      req.user = payload as AuthUser;
    }
    
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Forbidden",
        message: `Role ${req.user.role} is not authorized. Allowed roles: ${roles.join(', ')}`
      });
    }
    next();
  };
}

/**
 * Allow if request has a driver token OR a user token with one of the specified roles.
 * Useful for endpoints that both drivers (driver token) and staff/managers (user token) can access.
 */
export function requireRoleOrDriver(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Allow driver token
    if (req.driver) {
      return next();
    }
    // Otherwise require user token with allowed role
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

/**
 * Franchise Scope Guard
 * Managers can only access their franchise data
 */
export function franchiseScopeGuard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Managers can only access their franchise
  if (req.user.role === UserRole.MANAGER) {
    // Check if request is accessing franchise data
    const requestedFranchiseId = req.params.franchiseId || req.body.franchiseId;
    if (requestedFranchiseId && requestedFranchiseId !== req.user.franchiseId) {
      return res.status(403).json({ error: "Access denied to this franchise" });
    }
  }
  
  next();
}
