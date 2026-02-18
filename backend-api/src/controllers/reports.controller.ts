import { Request, Response, NextFunction } from "express";
import {
  generateRevenueReport,
  generateTripReport,
  generateDriverReport,
  generateStaffReport,
  generateFranchiseReport,
  generateComplaintReport,
  generateAttendanceReport,
} from "../services/reports.service";

// ============================================
// REVENUE REPORT
// ============================================

export async function getRevenueReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await generateRevenueReport(req.query as any, userRole, userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// TRIP REPORT
// ============================================

export async function getTripReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await generateTripReport(req.query as any, userRole, userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// DRIVER REPORT
// ============================================

export async function getDriverReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await generateDriverReport(req.query as any, userRole, userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// STAFF REPORT
// ============================================

export async function getStaffReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await generateStaffReport(req.query as any, userRole, userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// FRANCHISE REPORT (Admin only)
// ============================================

export async function getFranchiseReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await generateFranchiseReport(req.query as any);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// COMPLAINT REPORT
// ============================================

export async function getComplaintReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await generateComplaintReport(req.query as any, userRole, userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// ATTENDANCE REPORT
// ============================================

export async function getAttendanceReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await generateAttendanceReport(req.query as any, userRole, userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
