import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import {
  registerAdmin,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword,
  loginDriver,
  loginStaff,
  verifyOTP,
  registerSuperAdmin,
} from "../services/auth.service";
import { authMiddleware } from "../middlewares/auth";
import { ERROR_MESSAGES } from "../constants/errors";


export async function registerSuperAdminHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Validate input
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: "Invalid request body" });
    }
    
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    
    const result = await registerSuperAdmin({ name, email, password, phone });
    res.status(201).json({ message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function registerAdminHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await registerAdmin(req.body);
    res.status(201).json({ message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await login(req.body);
    res.json({ data: result });
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
    const result = await loginDriver(req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function loginStaffHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await loginStaff(req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await forgotPassword(req.body);
    res.status(200).json({ message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function verifyOTPHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await verifyOTP(req.body);
    res.status(200).json({ message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await resetPassword(req.body);
    res.status(200).json({ message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function refreshTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await refreshToken(req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user && !req.driver) {
      return res.status(401).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
    }

    // Support both User tokens (req.user) and Driver tokens (req.driver)
    const authenticatedId = req.user?.userId ?? req.driver?.driverId;
    if (!authenticatedId) {
      return res.status(401).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
    }

    const role = req.user?.role ?? (req.driver ? UserRole.DRIVER : undefined);
    const driverId = req.driver?.driverId;

    const result = await logout(authenticatedId, role, driverId);
    res.json({ message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const result = await getCurrentUser(req.user.userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const result = await changePassword(
      req.body,
      req.user.userId,
      req.user.role
    );
    res.json({ message: result.message });
  } catch (err) {
    next(err);
  }
}
