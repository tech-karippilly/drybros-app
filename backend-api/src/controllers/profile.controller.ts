// src/controllers/profile.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  getMyProfile,
  updateMyProfile,
  resetMyPassword
} from "../services/profile.service";

export async function getMyProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const profile = await getMyProfile(userId);
    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const updated = await updateMyProfile(userId, req.body);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function resetMyPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { oldPassword, newPassword } = req.body;
    await resetMyPassword(userId, oldPassword, newPassword);
    res.json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
}
