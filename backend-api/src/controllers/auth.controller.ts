import { Request, Response, NextFunction } from "express";
import { registerAdmin, login } from "../services/auth.service";

export async function registerAdminHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = await registerAdmin(req.body);
    res.status(201).json({ data: admin });
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
