import { Request, Response, NextFunction } from "express";
import {
  createStaff,
  listStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
  getMyProfile,
} from "../services/staff-clean.service";

// ============================================
// CREATE STAFF
// ============================================

export async function createStaffHandler(
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

    const result = await createStaff(req.body, userId, userRole);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// LIST STAFF
// ============================================

export async function listStaffHandler(
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

    const result = await listStaff(req.query as any, userRole, userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// GET STAFF BY ID
// ============================================

export async function getStaffByIdHandler(
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

    const staffId = req.params.id as string;
    const result = await getStaffById(staffId, userRole, userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// UPDATE STAFF
// ============================================

export async function updateStaffHandler(
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

    const staffId = req.params.id as string;
    const result = await updateStaff(staffId, req.body, userRole, userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// UPDATE STAFF STATUS
// ============================================

export async function updateStaffStatusHandler(
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

    const staffId = req.params.id as string;
    const result = await updateStaffStatus(staffId, req.body, userRole, userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================
// GET MY PROFILE (for STAFF role)
// ============================================

export async function getMyProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get staffId from authenticated user (if staff auth is implemented differently)
    // For now, use userId as staffId placeholder
    const staffId = req.user?.userId; // Adjust based on actual auth implementation

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: "Staff authentication required",
      });
    }

    const result = await getMyProfile(staffId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
