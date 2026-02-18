import { Request, Response, NextFunction } from "express";
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
} from "../services/notification.service";
import { sendOtp, verifyOtp } from "../services/otp.service";

// ============================================
// GET NOTIFICATIONS
// ============================================

export async function getNotificationsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Determine which ID to use based on role
    // For now, use userId for all. Can be extended for driver/staff specific auth
    const result = await listNotifications(userId, undefined, undefined, req.query as any);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// MARK NOTIFICATION AS READ
// ============================================

export async function markAsReadHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const notificationId = req.params.id as string;
    const result = await markAsRead(notificationId, userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// MARK ALL AS READ
// ============================================

export async function markAllAsReadHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await markAllAsRead(userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// SEND OTP
// ============================================

export async function sendOtpHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await sendOtp(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// VERIFY OTP
// ============================================

export async function verifyOtpHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await verifyOtp(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
