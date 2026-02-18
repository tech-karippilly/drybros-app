import prisma from "../config/prismaClient";
import { UserRole } from "@prisma/client";
import {
  RevenueReportQueryDTO,
  TripReportQueryDTO,
  DriverReportQueryDTO,
  StaffReportQueryDTO,
  FranchiseReportQueryDTO,
  ComplaintReportQueryDTO,
  AttendanceReportQueryDTO,
  MetricType,
} from "../types/reports.dto";
import logger from "../config/logger";

// ============================================
// REVENUE ANALYTICS
// ============================================

export async function generateRevenueReport(
  filters: RevenueReportQueryDTO,
  userRole: UserRole,
  userId: string
) {
  try {
    const { franchiseId, startDate, endDate, groupBy } = filters;

    // Apply franchise isolation for MANAGER
    let effectiveFranchiseId = franchiseId;
    if (userRole === UserRole.MANAGER) {
      const manager = await prisma.user.findUnique({
        where: { id: userId },
        select: { franchiseId: true },
      });
      effectiveFranchiseId = manager?.franchiseId;
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Query trips with revenue
    const trips = await prisma.trip.findMany({
      where: {
        ...(effectiveFranchiseId && { franchiseId: effectiveFranchiseId }),
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        status: { in: ["COMPLETED", "PAYMENT_DONE"] },
      },
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
        franchiseId: true,
        tripType: true,
        // paymentMode: true, // May not exist in schema
      },
    });

    // Calculate summary
    const totalRevenue = trips.reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
    const totalTrips = trips.length;
    const averageRevenuePerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0;

    // Group by franchise
    const franchiseMap = new Map<string, { revenue: number; trips: number }>();
    for (const trip of trips) {
      const existing = franchiseMap.get(trip.franchiseId) || { revenue: 0, trips: 0 };
      existing.revenue += Number(trip.totalAmount || 0);
      existing.trips += 1;
      franchiseMap.set(trip.franchiseId, existing);
    }

    const breakdown = Array.from(franchiseMap.entries()).map(([fId, data]) => ({
      label: fId,
      revenue: data.revenue,
      trips: data.trips,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }));

    // Chart data (grouped by date)
    const dateMap = new Map<string, { revenue: number; trips: number }>();
    for (const trip of trips) {
      const dateKey = trip.createdAt.toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || { revenue: 0, trips: 0 };
      existing.revenue += Number(trip.totalAmount || 0);
      existing.trips += 1;
      dateMap.set(dateKey, existing);
    }

    const chartData = Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      message: "Revenue report generated successfully",
      data: {
        summary: {
          totalRevenue,
          totalTrips,
          averageRevenuePerTrip,
          period: `${startDate || 'all'} to ${endDate || 'all'}`,
        },
        breakdown,
        chartData,
      },
      generatedAt: new Date(),
    };
  } catch (error) {
    logger.error("Failed to generate revenue report", { error });
    throw error;
  }
}

// ============================================
// TRIP ANALYTICS
// ============================================

export async function generateTripReport(
  filters: TripReportQueryDTO,
  userRole: UserRole,
  userId: string
) {
  try {
    const { franchiseId, startDate, endDate } = filters;

    // Apply franchise isolation
    let effectiveFranchiseId = franchiseId;
    if (userRole === UserRole.MANAGER) {
      const manager = await prisma.user.findUnique({
        where: { id: userId },
        select: { franchiseId: true },
      });
      effectiveFranchiseId = manager?.franchiseId;
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Query all trips
    const trips = await prisma.trip.findMany({
      where: {
        ...(effectiveFranchiseId && { franchiseId: effectiveFranchiseId }),
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    const totalTrips = trips.length;
    const completedTrips = trips.filter(t => 
      t.status === "COMPLETED" || t.status === "PAYMENT_DONE"
    ).length;
    const cancelledTrips = trips.filter(t => 
      t.status === "CANCELLED_BY_CUSTOMER" || t.status === "CANCELLED_BY_OFFICE"
    ).length;

    // Aggregate metrics (placeholders for missing fields)
    const avgTripDuration = 0; // Would need startTime/endTime fields
    const avgTripDistance = 0; // Would need distance field
    const reassignmentRate = 0; // Would need reassignment tracking
    const rescheduleRate = 0; // Would need reschedule tracking
    const driverAcceptanceRate = completedTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;

    // Status breakdown
    const statusMap = new Map<string, number>();
    for (const trip of trips) {
      const count = statusMap.get(trip.status) || 0;
      statusMap.set(trip.status, count + 1);
    }

    const breakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
      label: status,
      count,
      percentage: totalTrips > 0 ? (count / totalTrips) * 100 : 0,
    }));

    // Chart data by date
    const dateMap = new Map<string, { completed: number; cancelled: number }>();
    for (const trip of trips) {
      const dateKey = trip.createdAt.toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || { completed: 0, cancelled: 0 };
      if (trip.status === "COMPLETED" || trip.status === "PAYMENT_DONE") {
        existing.completed += 1;
      } else if (trip.status === "CANCELLED_BY_CUSTOMER" || trip.status === "CANCELLED_BY_OFFICE") {
        existing.cancelled += 1;
      }
      dateMap.set(dateKey, existing);
    }

    const chartData = Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      message: "Trip report generated successfully",
      data: {
        summary: {
          totalTrips,
          completedTrips,
          cancelledTrips,
          avgTripDuration,
          avgTripDistance,
          reassignmentRate,
          rescheduleRate,
          driverAcceptanceRate,
        },
        breakdown,
        chartData,
      },
      generatedAt: new Date(),
    };
  } catch (error) {
    logger.error("Failed to generate trip report", { error });
    throw error;
  }
}

// ============================================
// DRIVER ANALYTICS
// ============================================

export async function generateDriverReport(
  filters: DriverReportQueryDTO,
  userRole: UserRole,
  userId: string
) {
  try {
    const { franchiseId, month, year, metricType, limit } = filters;

    // Apply franchise isolation
    let effectiveFranchiseId = franchiseId;
    if (userRole === UserRole.MANAGER) {
      const manager = await prisma.user.findUnique({
        where: { id: userId },
        select: { franchiseId: true },
      });
      effectiveFranchiseId = manager?.franchiseId;
    }

    // Get drivers
    const drivers = await prisma.driver.findMany({
      where: {
        ...(effectiveFranchiseId && { franchiseId: effectiveFranchiseId }),
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        driverCode: true,
        currentRating: true,
      },
      take: limit || 10,
    });

    const totalDrivers = drivers.length;
    const activeDrivers = drivers.length;
    const avgRating = drivers.reduce((sum, d) => sum + (d.currentRating || 0), 0) / (totalDrivers || 1);

    // Get trip counts per driver for ranking
    const driverTrips = await prisma.trip.groupBy({
      by: ['driverId'],
      where: {
        ...(effectiveFranchiseId && { franchiseId: effectiveFranchiseId }),
        status: { in: ["COMPLETED", "PAYMENT_DONE"] },
      },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    // Build top drivers based on metric type
    let topDrivers: any[] = [];
    if (metricType === MetricType.REVENUE) {
      topDrivers = driverTrips
        .map(dt => {
          const driver = drivers.find(d => d.id === dt.driverId);
          return {
            driverId: dt.driverId,
            driverName: driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown',
            driverCode: driver?.driverCode || 'N/A',
            metric: Number(dt._sum.totalAmount || 0),
            rank: 0,
          };
        })
        .sort((a, b) => b.metric - a.metric)
        .slice(0, limit || 10)
        .map((d, idx) => ({ ...d, rank: idx + 1 }));
    } else if (metricType === MetricType.TRIPS) {
      topDrivers = driverTrips
        .map(dt => {
          const driver = drivers.find(d => d.id === dt.driverId);
          return {
            driverId: dt.driverId,
            driverName: driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown',
            driverCode: driver?.driverCode || 'N/A',
            metric: dt._count.id,
            rank: 0,
          };
        })
        .sort((a, b) => b.metric - a.metric)
        .slice(0, limit || 10)
        .map((d, idx) => ({ ...d, rank: idx + 1 }));
    } else if (metricType === MetricType.RATING) {
      topDrivers = drivers
        .sort((a, b) => (b.currentRating || 0) - (a.currentRating || 0))
        .slice(0, limit || 10)
        .map((d, idx) => ({
          driverId: d.id,
          driverName: `${d.firstName} ${d.lastName}`,
          driverCode: d.driverCode,
          metric: d.currentRating || 0,
          rank: idx + 1,
        }));
    }

    return {
      success: true,
      message: "Driver report generated successfully",
      data: {
        summary: {
          totalDrivers,
          activeDrivers,
          avgRating,
        },
        topDrivers,
        chartData: topDrivers.map(d => ({
          name: d.driverName,
          value: d.metric,
        })),
      },
      generatedAt: new Date(),
    };
  } catch (error) {
    logger.error("Failed to generate driver report", { error });
    throw error;
  }
}

// ============================================
// STAFF ANALYTICS (Placeholder)
// ============================================

export async function generateStaffReport(
  filters: StaffReportQueryDTO,
  userRole: UserRole,
  userId: string
) {
  // Placeholder - would aggregate from staff performance data
  return {
    success: true,
    message: "Staff report generated successfully",
    data: {
      summary: {
        totalStaff: 0,
        activeStaff: 0,
        avgAttendance: 0,
      },
      staffMetrics: [],
    },
    generatedAt: new Date(),
  };
}

// ============================================
// FRANCHISE ANALYTICS (Admin only)
// ============================================

export async function generateFranchiseReport(
  filters: FranchiseReportQueryDTO
) {
  // Placeholder - would aggregate across all franchises
  return {
    success: true,
    message: "Franchise report generated successfully",
    data: {
      summary: {
        totalFranchises: 0,
        totalRevenue: 0,
        totalTrips: 0,
      },
      franchiseComparison: [],
      chartData: [],
    },
    generatedAt: new Date(),
  };
}

// ============================================
// COMPLAINT TRENDS
// ============================================

export async function generateComplaintReport(
  filters: ComplaintReportQueryDTO,
  userRole: UserRole,
  userId: string
) {
  // Placeholder - would aggregate complaint data
  return {
    success: true,
    message: "Complaint report generated successfully",
    data: {
      summary: {
        totalComplaints: 0,
        resolvedComplaints: 0,
        avgResolutionTime: 0,
      },
      breakdown: [],
      chartData: [],
    },
    generatedAt: new Date(),
  };
}

// ============================================
// ATTENDANCE ANALYTICS
// ============================================

export async function generateAttendanceReport(
  filters: AttendanceReportQueryDTO,
  userRole: UserRole,
  userId: string
) {
  // Placeholder - would aggregate attendance data
  return {
    success: true,
    message: "Attendance report generated successfully",
    data: {
      summary: {
        totalRecords: 0,
        avgAttendanceRate: 0,
        avgOnlineHours: 0,
        absenteeRate: 0,
        leaveRate: 0,
      },
      breakdown: [],
      chartData: [],
    },
    generatedAt: new Date(),
  };
}
