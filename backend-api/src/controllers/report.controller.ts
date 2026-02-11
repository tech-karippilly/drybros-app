// src/controllers/report.controller.ts

import { Request, Response, NextFunction } from "express";
import {
  generateTripReport,
  generateDriverPerformanceReport,
  generateAttendanceReport,
  generateDispatchReport,
  exportTripReportCSV,
  exportAttendanceReportCSV,
  convertToCSVString,
} from "../services/report.service";
import { REPORT_CONSTANTS } from "../constants/report";
import { BadRequestError } from "../utils/errors";

/**
 * GET /reports/trips
 * Generate trip report with statistics
 */
export async function getTripReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate, driverId, franchiseId, status, skip, take } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError("startDate and endDate are required");
    }

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      driverId: driverId as string | undefined,
      franchiseId: franchiseId as string | undefined,
      status: status as any,
      skip: skip ? parseInt(skip as string, 10) : 0,
      take: take ? Math.min(parseInt(take as string, 10), REPORT_CONSTANTS.MAX_PAGE_SIZE) : REPORT_CONSTANTS.DEFAULT_PAGE_SIZE,
    };

    const report = await generateTripReport(
      filters,
      req.user!.userId,
      req.user!.role
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /reports/driver-performance/:driverId
 * Generate driver performance report
 */
export async function getDriverPerformanceReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { driverId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError("startDate and endDate are required");
    }

    const filters = {
      driverId: String(driverId),
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
    };

    const report = await generateDriverPerformanceReport(
      filters,
      req.user!.userId,
      req.user!.role
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /reports/attendance
 * Generate attendance report
 */
export async function getAttendanceReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate, driverId, status, skip, take } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError("startDate and endDate are required");
    }

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      driverId: driverId as string | undefined,
      status: status as any,
      skip: skip ? parseInt(skip as string, 10) : 0,
      take: take ? Math.min(parseInt(take as string, 10), REPORT_CONSTANTS.MAX_PAGE_SIZE) : REPORT_CONSTANTS.DEFAULT_PAGE_SIZE,
    };

    const report = await generateAttendanceReport(
      filters,
      req.user!.userId,
      req.user!.role
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /reports/dispatch
 * Generate dispatch/system report (Admin only)
 */
export async function getDispatchReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError("startDate and endDate are required");
    }

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
    };

    const report = await generateDispatchReport(
      filters,
      req.user!.userId,
      req.user!.role
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /reports/trips/export
 * Export trip report as CSV
 */
export async function exportTripReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate, driverId, franchiseId, status } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError("startDate and endDate are required");
    }

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      driverId: driverId as string | undefined,
      franchiseId: franchiseId as string | undefined,
      status: status as any,
    };

    const csvData = await exportTripReportCSV(filters);
    const csvString = convertToCSVString(csvData.headers, csvData.rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="trip-report-${Date.now()}.csv"`);
    res.send(csvString);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /reports/attendance/export
 * Export attendance report as CSV
 */
export async function exportAttendanceReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate, driverId, status } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError("startDate and endDate are required");
    }

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      driverId: driverId as string | undefined,
      status: status as any,
    };

    const csvData = await exportAttendanceReportCSV(filters);
    const csvString = convertToCSVString(csvData.headers, csvData.rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="attendance-report-${Date.now()}.csv"`);
    res.send(csvString);
  } catch (error) {
    next(error);
  }
}
