import { Request, Response, NextFunction } from "express";
import {
  registerAdmin,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
} from "../services/auth.service";

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
