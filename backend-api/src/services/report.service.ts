// src/services/report.service.ts

import {
  getTripStatistics,
  getTripListForReport,
  getDriverPerformanceMetrics,
  getAttendanceForReport,
  getDispatchStatistics,
  TripReportFilters,
  DriverPerformanceFilters,
  AttendanceReportFilters,
} from "../repositories/report.repository";
import { REPORT_CONSTANTS, REPORT_ERROR_MESSAGES } from "../constants/report";
import { BadRequestError, ForbiddenError } from "../utils/errors";
import logger from "../config/logger";

/**
 * Validate date range
 */
function validateDateRange(startDate: Date, endDate: Date): void {
  if (startDate > endDate) {
    throw new BadRequestError(REPORT_ERROR_MESSAGES.INVALID_DATE_RANGE);
  }

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > REPORT_CONSTANTS.MAX_DATE_RANGE_DAYS) {
    throw new BadRequestError(
      `${REPORT_ERROR_MESSAGES.DATE_RANGE_TOO_LARGE}. Maximum ${REPORT_CONSTANTS.MAX_DATE_RANGE_DAYS} days allowed.`
    );
  }
}

/**
 * Generate Trip Report
 */
export async function generateTripReport(
  filters: TripReportFilters,
  requestingUserId: string,
  requestingUserRole: string
) {
  validateDateRange(filters.startDate, filters.endDate);

  logger.info("Generating trip report", {
    userId: requestingUserId,
    role: requestingUserRole,
    filters,
  });

  const [statistics, tripList] = await Promise.all([
    getTripStatistics(filters),
    getTripListForReport(filters),
  ]);

  logger.info("Trip report generated", {
    userId: requestingUserId,
    totalTrips: statistics.totalTrips,
    recordCount: tripList.trips.length,
  });

  return {
    summary: statistics,
    trips: tripList.trips,
    pagination: {
      total: tripList.total,
      skip: filters.skip || 0,
      take: filters.take || REPORT_CONSTANTS.DEFAULT_PAGE_SIZE,
    },
    filters: {
      startDate: filters.startDate,
      endDate: filters.endDate,
      driverId: filters.driverId,
      franchiseId: filters.franchiseId,
      status: filters.status,
    },
  };
}

/**
 * Generate Driver Performance Report
 */
export async function generateDriverPerformanceReport(
  filters: DriverPerformanceFilters,
  requestingUserId: string,
  requestingUserRole: string
) {
  validateDateRange(filters.startDate, filters.endDate);

  // Drivers can only view their own reports
  if (requestingUserRole === "DRIVER" && filters.driverId !== requestingUserId) {
    throw new ForbiddenError(REPORT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
  }

  logger.info("Generating driver performance report", {
    userId: requestingUserId,
    role: requestingUserRole,
    driverId: filters.driverId,
  });

  const metrics = await getDriverPerformanceMetrics(filters);

  logger.info("Driver performance report generated", {
    userId: requestingUserId,
    driverId: filters.driverId,
    totalTrips: metrics.trips.total,
  });

  return {
    driverId: filters.driverId,
    period: {
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
    trips: metrics.trips,
    offers: metrics.offers,
    attendance: metrics.attendance,
    earnings: metrics.earnings,
  };
}

/**
 * Generate Attendance Report
 */
export async function generateAttendanceReport(
  filters: AttendanceReportFilters,
  requestingUserId: string,
  requestingUserRole: string
) {
  validateDateRange(filters.startDate, filters.endDate);

  // Drivers can only view their own attendance
  if (requestingUserRole === "DRIVER" && filters.driverId !== requestingUserId) {
    throw new ForbiddenError(REPORT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
  }

  logger.info("Generating attendance report", {
    userId: requestingUserId,
    role: requestingUserRole,
    filters,
  });

  const result = await getAttendanceForReport(filters);

  logger.info("Attendance report generated", {
    userId: requestingUserId,
    recordCount: result.total,
  });

  return {
    attendance: result.attendance,
    summary: result.summary,
    pagination: {
      total: result.total,
      skip: filters.skip || 0,
      take: filters.take || REPORT_CONSTANTS.DEFAULT_PAGE_SIZE,
    },
    filters: {
      startDate: filters.startDate,
      endDate: filters.endDate,
      driverId: filters.driverId,
      status: filters.status,
    },
  };
}

/**
 * Generate Dispatch/System Report (Admin only)
 */
export async function generateDispatchReport(
  filters: { startDate: Date; endDate: Date },
  requestingUserId: string,
  requestingUserRole: string
) {
  // Only admins can access dispatch reports
  if (!["ADMIN", "MANAGER"].includes(requestingUserRole)) {
    throw new ForbiddenError(REPORT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
  }

  validateDateRange(filters.startDate, filters.endDate);

  logger.info("Generating dispatch report", {
    userId: requestingUserId,
    role: requestingUserRole,
    filters,
  });

  const statistics = await getDispatchStatistics(filters);

  logger.info("Dispatch report generated", {
    userId: requestingUserId,
    totalOffers: statistics.totalOffers,
  });

  return {
    period: {
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
    statistics,
  };
}

/**
 * Export Trip Report to CSV
 */
export async function exportTripReportCSV(filters: TripReportFilters) {
  // Fetch all data without pagination for export
  const result = await getTripListForReport({
    ...filters,
    skip: 0,
    take: REPORT_CONSTANTS.MAX_EXPORT_RECORDS,
  });

  if (result.total > REPORT_CONSTANTS.MAX_EXPORT_RECORDS) {
    throw new BadRequestError(
      `${REPORT_ERROR_MESSAGES.EXPORT_LIMIT_EXCEEDED}. Maximum ${REPORT_CONSTANTS.MAX_EXPORT_RECORDS} records allowed.`
    );
  }

  // CSV headers
  const headers = [
    "Trip ID",
    "Trip Type",
    "Status",
    "Driver",
    "Driver Code",
    "Created At",
    "Started At",
    "Ended At",
    "Pickup Location",
    "Drop Location",
    "Final Amount",
    "Payment Status",
    "Offer Count",
    "Accepted Offers",
    "Rejected Offers",
    "Expired Offers",
    "Assignment Delay (min)",
  ];

  // CSV rows
  const rows = result.trips.map((trip) => [
    trip.id,
    trip.tripType,
    trip.status,
    trip.driverName,
    trip.driverCode,
    trip.createdAt.toISOString(),
    trip.startedAt?.toISOString() || "N/A",
    trip.endedAt?.toISOString() || "N/A",
    trip.pickupLocation,
    trip.dropLocation,
    trip.finalAmount,
    trip.paymentStatus,
    trip.offerCount,
    trip.acceptedOffers,
    trip.rejectedOffers,
    trip.expiredOffers,
    trip.assignmentDelayMinutes !== null ? trip.assignmentDelayMinutes : "N/A",
  ]);

  return {
    headers,
    rows,
  };
}

/**
 * Export Attendance Report to CSV
 */
export async function exportAttendanceReportCSV(filters: AttendanceReportFilters) {
  const result = await getAttendanceForReport({
    ...filters,
    skip: 0,
    take: REPORT_CONSTANTS.MAX_EXPORT_RECORDS,
  });

  if (result.total > REPORT_CONSTANTS.MAX_EXPORT_RECORDS) {
    throw new BadRequestError(
      `${REPORT_ERROR_MESSAGES.EXPORT_LIMIT_EXCEEDED}. Maximum ${REPORT_CONSTANTS.MAX_EXPORT_RECORDS} records allowed.`
    );
  }

  const headers = [
    "Date",
    "Driver Name",
    "Driver Code",
    "Status",
    "First Online",
    "Last Offline",
    "Total Online Minutes",
    "Trips Completed",
  ];

  const rows = result.attendance.map((a) => [
    a.date.toISOString().split("T")[0],
    a.driverName,
    a.driverCode,
    a.status,
    a.firstOnlineAt?.toISOString() || "N/A",
    a.lastOfflineAt?.toISOString() || "N/A",
    a.totalOnlineMinutes,
    a.tripsCompleted,
  ]);

  return {
    headers,
    rows,
  };
}

/**
 * Helper to convert CSV data to string
 */
export function convertToCSVString(headers: string[], rows: (string | number | null)[][]): string {
  const escapeCsvValue = (value: string | number | null): string => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const csvLines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ];

  return csvLines.join("\n");
}
