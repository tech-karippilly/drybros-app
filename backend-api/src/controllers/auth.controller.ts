import { Request, Response, NextFunction } from "express";
import {
  registerAdmin,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  getCurrentUser,
} from "../services/auth.service";
import { authMiddleware } from "../middlewares/auth";

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
