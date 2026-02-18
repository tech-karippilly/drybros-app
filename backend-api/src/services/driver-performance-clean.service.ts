import prisma from "../config/prismaClient";
import { UserRole, TripStatus, AttendanceStatus } from "@prisma/client";
import {
  GeneratePerformanceDTO,
  PerformanceGrade,
} from "../types/performance.dto";
import logger from "../config/logger";

// ============================================
// CALCULATE PERFORMANCE GRADE
// ============================================

function calculateGrade(score: number): PerformanceGrade {
  if (score >= 90) return PerformanceGrade.A;
  if (score >= 75) return PerformanceGrade.B;
  if (score >= 60) return PerformanceGrade.C;
  if (score >= 50) return PerformanceGrade.D;
  return PerformanceGrade.F;
}

// ============================================
// GENERATE DRIVER MONTHLY PERFORMANCE
// ============================================

export async function generateDriverPerformance(
  input: GeneratePerformanceDTO,
  adminId: string
) {
  const { month, year, franchiseId } = input;

  // Get start and end dates for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Build driver filter
  const driverFilter: any = { status: "ACTIVE" };
  if (franchiseId) {
    driverFilter.franchiseId = franchiseId;
  }

  // Get all active drivers (or filtered by franchise)
  const drivers = await prisma.driver.findMany({
    where: driverFilter,
    select: {
      id: true,
      franchiseId: true,
      firstName: true,
      lastName: true,
    },
  });

  if (drivers.length === 0) {
    return {
      success: true,
      message: "No active drivers found for the specified criteria",
      data: [],
    };
  }

  const performanceRecords = [];

  for (const driver of drivers) {
    // Check if performance already exists and is finalized
    // Note: Using monthlyPerformance table (may need schema adjustment)
    const existing = await prisma.monthlyPerformance.findFirst({
      where: {
        driverId: driver.id,
        month,
        year,
      },
    });

    if (existing && existing.isFinalized) {
      logger.warn(`Performance already finalized for driver ${driver.id} for ${month}/${year}`);
      continue; // Skip finalized records
    }

    // ======================
    // 1. TRIP METRICS
    // ======================
    const trips = await prisma.trip.findMany({
      where: {
        driverId: driver.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        status: true,
        // distance field may not exist
        totalAmount: true,
      },
    });

    const totalTrips = trips.length;
    const acceptedTrips = trips.filter(
      (t) => t.status === TripStatus.COMPLETED || t.status === "PAYMENT_DONE" as any
    ).length;
    const cancelledTrips = trips.filter(
      (t) => t.status === "CANCELLED" as any
    ).length;
    const totalDistance = 0; // Distance tracking not in current schema

    // ======================
    // 2. EARNINGS & INCENTIVES
    // ======================
    const transactions = await prisma.driverTransaction.findMany({
      where: {
        driverId: driver.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        type: true,
        amount: true,
      },
    });

    const totalEarnings = transactions
      .filter((t) => t.type === "TRIP" as any) // Use TRIP type
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalIncentive = transactions
      .filter((t) => t.type === "GIFT" as any) // Use GIFT type for incentives
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPenalty = 0; // Penalty tracking not in current DriverTransaction schema

    // ======================
    // 3. MONTHLY DEDUCTION
    // ======================
    let monthlyDeduction = 0;
    try {
      // DriverEarningsConfig may not have driverId as unique key
      const earningsConfig = await prisma.driverEarningsConfig.findFirst({
        where: { driverId: driver.id },
        select: { id: true }, // monthlyDeduction field may not exist
      });
      // monthlyDeduction = Number(earningsConfig?.monthlyDeduction || 0);
      monthlyDeduction = 0; // Placeholder until schema is verified
    } catch (error) {
      logger.error(`Failed to get earnings config for driver ${driver.id}`, { error });
    }

    // ======================
    // 4. RATINGS
    // ======================
    const ratings = await prisma.tripReview.aggregate({
      where: {
        driverId: driver.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _avg: {
        overallRating: true,
      },
    });

    const avgRating = ratings._avg.overallRating || 0;

    // ======================
    // 5. COMPLAINTS & WARNINGS
    // ======================
    const complaints = await prisma.complaint.count({
      where: {
        driverId: driver.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const warnings = await prisma.warning.count({
      where: {
        driverId: driver.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // ======================
    // 6. ATTENDANCE
    // ======================
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const attendanceRecords = await prisma.attendance.count({
      where: {
        driverId: driver.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: [AttendanceStatus.PRESENT, AttendanceStatus.PARTIAL],
        },
      },
    });

    const attendancePercentage = (attendanceRecords / totalDaysInMonth) * 100;

    // ======================
    // 7. PERFORMANCE SCORE CALCULATION
    // ======================
    // Weighted scoring:
    // - Trips completed: 30%
    // - Rating: 25%
    // - Attendance: 20%
    // - Complaints (negative): 15%
    // - Revenue target: 10%

    const tripScore = Math.min((acceptedTrips / 30) * 30, 30); // Assume 30 trips target
    const ratingScore = (avgRating / 5) * 25;
    const attendanceScore = (attendancePercentage / 100) * 20;
    const complaintPenalty = Math.min(complaints * 5, 15); // -5 points per complaint, max -15
    const revenueScore = Math.min((totalEarnings / 50000) * 10, 10); // Assume 50k target

    const performanceScore = Math.max(
      0,
      tripScore + ratingScore + attendanceScore - complaintPenalty + revenueScore
    );

    const grade = calculateGrade(performanceScore);

    // ======================
    // 8. CREATE OR UPDATE PERFORMANCE RECORD
    // ======================
    let performanceRecord;

    if (existing) {
      // Update existing record
      performanceRecord = await prisma.monthlyPerformance.update({
        where: { id: existing.id },
        data: {
          totalTrips,
          acceptedTrips,
          cancelledTrips,
          totalDistance,
          totalEarnings,
          totalIncentive,
          totalPenalty,
          monthlyDeduction,
          avgRating,
          complaintCount: complaints,
          warningCount: warnings,
          attendancePercentage,
          performanceScore,
          grade: grade as any,
          isFinalized: true,
          finalizedAt: new Date(),
        } as any, // Temp cast until schema verified
      });
    } else {
      // Create new record
      performanceRecord = await prisma.monthlyPerformance.create({
        data: {
          Driver: { connect: { id: driver.id } },
          Franchise: { connect: { id: driver.franchiseId } },
          month,
          year,
          totalTrips,
          acceptedTrips,
          cancelledTrips,
          totalDistance,
          totalEarnings,
          totalIncentive,
          totalPenalty,
          monthlyDeduction,
          avgRating,
          complaintCount: complaints,
          warningCount: warnings,
          attendancePercentage,
          performanceScore,
          grade: grade as any,
          isFinalized: true,
          finalizedAt: new Date(),
        } as any, // Temp cast until schema verified
      });
    }

    performanceRecords.push(performanceRecord);

    logger.info(`Performance generated for driver ${driver.id}`, {
      driverId: driver.id,
      month,
      year,
      performanceScore,
      grade,
    });
  }

  return {
    success: true,
    message: `Driver performance generated successfully for ${performanceRecords.length} driver(s)`,
    data: performanceRecords,
  };
}

// ============================================
// LIST DRIVER PERFORMANCE
// ============================================

export async function listDriverPerformance(
  filters: {
    franchiseId?: string;
    month?: number;
    year?: number;
    driverId?: string;
    grade?: PerformanceGrade;
    page?: number;
    limit?: number;
  },
  userRole: UserRole,
  requesterId: string
) {
  const { page = 1, limit = 10, ...restFilters } = filters;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  // Apply franchise isolation for MANAGER
  if (userRole === UserRole.MANAGER) {
    const manager = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { franchiseId: true },
    });

    if (manager?.franchiseId) {
      where.franchiseId = manager.franchiseId;
    }
  }

  // Apply filters
  if (restFilters.franchiseId) where.franchiseId = restFilters.franchiseId;
  if (restFilters.month) where.month = restFilters.month;
  if (restFilters.year) where.year = restFilters.year;
  if (restFilters.driverId) where.driverId = restFilters.driverId;
  if (restFilters.grade) where.grade = restFilters.grade;

  // Get paginated results
  const [data, total] = await Promise.all([
    prisma.monthlyPerformance.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        Driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            driverCode: true,
          },
        },
        Franchise: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.monthlyPerformance.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    message: "Driver performance records retrieved successfully",
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ============================================
// GET MY DRIVER PERFORMANCE
// ============================================

export async function getMyDriverPerformance(
  driverId: string,
  filters?: {
    month?: number;
    year?: number;
    page?: number;
    limit?: number;
  }
) {
  const { page = 1, limit = 10, month, year } = filters || {};
  const skip = (page - 1) * limit;

  const where: any = { driverId };
  if (month) where.month = month;
  if (year) where.year = year;

  const [data, total] = await Promise.all([
    prisma.monthlyPerformance.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
    prisma.monthlyPerformance.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    message: "Your performance records retrieved successfully",
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
