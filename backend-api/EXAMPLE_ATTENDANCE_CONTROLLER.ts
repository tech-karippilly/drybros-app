// Example: How to integrate online status in attendance controller
// This is a reference implementation - adapt to your existing attendance controller

import { Request, Response } from "express";
import { ActivityAction, ActivityEntityType } from "@prisma/client";
import { logActivity } from "../services/activity.service";
import prisma from "../config/prismaClient";

/**
 * Clock-in endpoint for staff/driver
 */
export async function clockIn(req: Request, res: Response) {
  try {
    const { staffId, driverId, latitude, longitude } = req.body;
    const franchiseId = req.user?.franchiseId;

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        staffId: staffId || undefined,
        driverId: driverId || undefined,
        clockIn: new Date(),
        clockInLatitude: latitude,
        clockInLongitude: longitude,
      },
    });

    // Log activity - this automatically:
    // 1. Updates onlineStatus to true
    // 2. Emits socket event for status change
    // 3. Creates activity log
    await logActivity({
      action: staffId ? ActivityAction.STAFF_CLOCK_IN : ActivityAction.DRIVER_CLOCK_IN,
      entityType: ActivityEntityType.ATTENDANCE,
      entityId: attendance.id,
      staffId: staffId || undefined,
      driverId: driverId || undefined,
      franchiseId: franchiseId,
      description: staffId 
        ? `Staff clocked in at ${new Date().toLocaleString()}`
        : `Driver clocked in at ${new Date().toLocaleString()}`,
      latitude,
      longitude,
      metadata: {
        attendanceId: attendance.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Clocked in successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Clock-in error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clock in",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Clock-out endpoint for staff/driver
 */
export async function clockOut(req: Request, res: Response) {
  try {
    const { attendanceId, latitude, longitude } = req.body;
    const franchiseId = req.user?.franchiseId;

    // Get attendance record
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!existingAttendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Update attendance record
    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        clockOut: new Date(),
        clockOutLatitude: latitude,
        clockOutLongitude: longitude,
      },
    });

    // Log activity - this automatically:
    // 1. Updates onlineStatus to false
    // 2. Emits socket event for status change
    // 3. Creates activity log
    await logActivity({
      action: attendance.staffId ? ActivityAction.STAFF_CLOCK_OUT : ActivityAction.DRIVER_CLOCK_OUT,
      entityType: ActivityEntityType.ATTENDANCE,
      entityId: attendance.id,
      staffId: attendance.staffId || undefined,
      driverId: attendance.driverId || undefined,
      franchiseId: franchiseId,
      description: attendance.staffId
        ? `Staff clocked out at ${new Date().toLocaleString()}`
        : `Driver clocked out at ${new Date().toLocaleString()}`,
      latitude,
      longitude,
      metadata: {
        attendanceId: attendance.id,
        duration: attendance.clockOut && attendance.clockIn
          ? (attendance.clockOut.getTime() - attendance.clockIn.getTime()) / 1000 / 60 // minutes
          : null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Clocked out successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Clock-out error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clock out",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get current online status for staff/driver
 */
export async function getOnlineStatus(req: Request, res: Response) {
  try {
    const { staffId, driverId } = req.query;

    if (staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: String(staffId) },
        select: {
          id: true,
          name: true,
          onlineStatus: true,
          lastStatusChange: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: staff,
      });
    }

    if (driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: String(driverId) },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
          onlineStatus: true,
          lastStatusChange: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: driver,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Please provide staffId or driverId",
    });
  } catch (error) {
    console.error("Get online status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get online status",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
