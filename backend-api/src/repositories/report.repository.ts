// src/repositories/report.repository.ts

import prisma from "../config/prismaClient";
import { TripStatus, AttendanceStatus } from "@prisma/client";

/**
 * Trip Report Filters
 */
export interface TripReportFilters {
  startDate: Date;
  endDate: Date;
  driverId?: string;
  franchiseId?: string;
  status?: TripStatus;
  skip?: number;
  take?: number;
}

/**
 * Driver Performance Filters
 */
export interface DriverPerformanceFilters {
  startDate: Date;
  endDate: Date;
  driverId: string;
}

/**
 * Attendance Report Filters
 */
export interface AttendanceReportFilters {
  startDate: Date;
  endDate: Date;
  driverId?: string;
  status?: AttendanceStatus;
  skip?: number;
  take?: number;
}

/**
 * Get trip statistics for report
 */
export async function getTripStatistics(filters: TripReportFilters) {
  const where: any = {
    createdAt: {
      gte: filters.startDate,
      lte: filters.endDate,
    },
  };

  if (filters.driverId) {
    where.driverId = filters.driverId;
  }

  if (filters.franchiseId) {
    where.franchiseId = filters.franchiseId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  // Get aggregated statistics
  const [stats, statusBreakdown] = await Promise.all([
    prisma.trip.aggregate({
      where,
      _count: { id: true },
      _avg: {
        finalAmount: true,
        startOdometer: true,
        endOdometer: true,
      },
      _sum: {
        finalAmount: true,
      },
    }),
    prisma.trip.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    }),
  ]);

  return {
    totalTrips: stats._count.id,
    totalRevenue: Number(stats._sum.finalAmount || 0),
    avgTripAmount: Number(stats._avg.finalAmount || 0),
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count.id,
    })),
  };
}

/**
 * Get paginated trip list for report
 */
export async function getTripListForReport(filters: TripReportFilters) {
  const where: any = {
    createdAt: {
      gte: filters.startDate,
      lte: filters.endDate,
    },
  };

  if (filters.driverId) {
    where.driverId = filters.driverId;
  }

  if (filters.franchiseId) {
    where.franchiseId = filters.franchiseId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      select: {
        id: true,
        tripType: true,
        status: true,
        createdAt: true,
        startedAt: true,
        endedAt: true,
        pickupLocation: true,
        dropLocation: true,
        finalAmount: true,
        paymentStatus: true,
        driverId: true,
        Driver: {
          select: {
            firstName: true,
            lastName: true,
            driverCode: true,
          },
        },
        TripOffers: {
          select: {
            id: true,
            status: true,
            offeredAt: true,
            acceptedAt: true,
            rejectedAt: true,
          },
          orderBy: {
            offeredAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: filters.skip || 0,
      take: filters.take || 50,
    }),
    prisma.trip.count({ where }),
  ]);

  return {
    trips: trips.map((trip) => ({
      id: trip.id,
      tripType: trip.tripType,
      status: trip.status,
      createdAt: trip.createdAt,
      startedAt: trip.startedAt,
      endedAt: trip.endedAt,
      pickupLocation: trip.pickupLocation,
      dropLocation: trip.dropLocation || "N/A",
      finalAmount: trip.finalAmount,
      paymentStatus: trip.paymentStatus,
      driverName: trip.Driver
        ? `${trip.Driver.firstName} ${trip.Driver.lastName}`
        : "Unassigned",
      driverCode: trip.Driver?.driverCode || "N/A",
      offerCount: trip.TripOffers.length,
      acceptedOffers: trip.TripOffers.filter((o) => o.status === "ACCEPTED").length,
      rejectedOffers: trip.TripOffers.filter((o) => o.status === "REJECTED").length,
      expiredOffers: trip.TripOffers.filter((o) => o.status === "EXPIRED").length,
      // Calculate assignment delay (time from creation to first acceptance)
      assignmentDelayMinutes: trip.TripOffers.find((o) => o.acceptedAt)
        ? Math.floor(
            (new Date(trip.TripOffers.find((o) => o.acceptedAt)!.acceptedAt!).getTime() -
              new Date(trip.createdAt).getTime()) /
              60000
          )
        : null,
    })),
    total,
  };
}

/**
 * Get driver performance metrics
 */
export async function getDriverPerformanceMetrics(filters: DriverPerformanceFilters) {
  const { driverId, startDate, endDate } = filters;

  // Get trip statistics
  const tripStats = await prisma.trip.aggregate({
    where: {
      driverId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      id: true,
    },
    _sum: {
      finalAmount: true,
    },
  });

  // Get trip status breakdown
  const tripStatusBreakdown = await prisma.trip.groupBy({
    by: ["status"],
    where: {
      driverId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: { id: true },
  });

  // Get offer statistics
  const offerStats = await prisma.tripOffer.groupBy({
    by: ["status"],
    where: {
      driverId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: { id: true },
  });

  // Get attendance summary
  const attendanceSummary = await prisma.attendance.groupBy({
    by: ["status"],
    where: {
      driverId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: { id: true },
    _sum: {
      totalOnlineMinutes: true,
      tripsCompleted: true,
    },
  });

  // Get daily metrics for earnings
  const dailyMetrics = await prisma.driverDailyMetrics.findMany({
    where: {
      driverId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
      numberOfTrips: true,
      incentive: true,
      bonus: true,
      cashInHand: true,
      remainingLimit: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  return {
    trips: {
      total: tripStats._count.id,
      totalRevenue: Number(tripStats._sum.finalAmount || 0),
      statusBreakdown: tripStatusBreakdown.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    },
    offers: {
      statusBreakdown: offerStats.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      acceptanceRate:
        offerStats.reduce((acc, s) => acc + (s.status === "ACCEPTED" ? s._count.id : 0), 0) /
        Math.max(offerStats.reduce((acc, s) => acc + s._count.id, 0), 1),
    },
    attendance: {
      statusBreakdown: attendanceSummary.map((s) => ({
        status: s.status,
        count: s._count.id,
        totalOnlineMinutes: Number(s._sum.totalOnlineMinutes || 0),
        totalTripsCompleted: Number(s._sum.tripsCompleted || 0),
      })),
    },
    earnings: {
      dailyMetrics: dailyMetrics.map((m) => ({
        date: m.date,
        trips: m.numberOfTrips,
        incentive: Number(m.incentive || 0),
        bonus: Number(m.bonus || 0),
        cashInHand: Number(m.cashInHand),
        remainingLimit: Number(m.remainingLimit || 0),
      })),
      totalIncentives: dailyMetrics.reduce((acc, m) => acc + Number(m.incentive || 0), 0),
      totalBonus: dailyMetrics.reduce((acc, m) => acc + Number(m.bonus || 0), 0),
    },
  };
}

/**
 * Get attendance records for report
 */
export async function getAttendanceForReport(filters: AttendanceReportFilters) {
  const where: any = {
    date: {
      gte: filters.startDate,
      lte: filters.endDate,
    },
  };

  if (filters.driverId) {
    where.driverId = filters.driverId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const [attendance, total, summary] = await Promise.all([
    prisma.attendance.findMany({
      where,
      select: {
        id: true,
        date: true,
        status: true,
        firstOnlineAt: true,
        lastOfflineAt: true,
        totalOnlineMinutes: true,
        tripsCompleted: true,
        driverId: true,
        Driver: {
          select: {
            firstName: true,
            lastName: true,
            driverCode: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      skip: filters.skip || 0,
      take: filters.take || 50,
    }),
    prisma.attendance.count({ where }),
    prisma.attendance.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
      _sum: {
        totalOnlineMinutes: true,
        tripsCompleted: true,
      },
    }),
  ]);

  return {
    attendance: attendance.map((a) => ({
      id: a.id,
      date: a.date,
      status: a.status,
      firstOnlineAt: a.firstOnlineAt,
      lastOfflineAt: a.lastOfflineAt,
      totalOnlineMinutes: a.totalOnlineMinutes || 0,
      tripsCompleted: a.tripsCompleted,
      driverName: a.Driver ? `${a.Driver.firstName} ${a.Driver.lastName}` : "N/A",
      driverCode: a.Driver?.driverCode || "N/A",
    })),
    total,
    summary: summary.map((s) => ({
      status: s.status,
      count: s._count.id,
      totalOnlineMinutes: Number(s._sum.totalOnlineMinutes || 0),
      totalTripsCompleted: Number(s._sum.tripsCompleted || 0),
    })),
  };
}

/**
 * Get dispatch/system statistics
 */
export async function getDispatchStatistics(filters: { startDate: Date; endDate: Date }) {
  const { startDate, endDate } = filters;

  // Get trip offer statistics
  const offerStats = await prisma.tripOffer.groupBy({
    by: ["status"],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: { id: true },
  });

  // Get trips with offer counts
  const tripsWithOfferCounts = await prisma.$queryRaw<
    Array<{ tripId: string; offerCount: number }>
  >`
    SELECT "tripId", COUNT(*) as "offerCount"
    FROM "TripOffer"
    WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
    GROUP BY "tripId"
  `;

  // Calculate averages
  const totalOffers = offerStats.reduce((acc, s) => acc + s._count.id, 0);
  const uniqueTrips = tripsWithOfferCounts.length;
  const avgOffersPerTrip = uniqueTrips > 0 ? totalOffers / uniqueTrips : 0;

  // Get exhausted trips (trips with many rejected/expired offers and still NOT_ASSIGNED)
  const exhaustedTrips = await prisma.trip.count({
    where: {
      status: "NOT_ASSIGNED",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      TripOffers: {
        some: {
          status: {
            in: ["REJECTED", "EXPIRED"],
          },
        },
      },
    },
  });

  return {
    totalOffers,
    offerStatusBreakdown: offerStats.map((s) => ({
      status: s.status,
      count: s._count.id,
      percentage: (s._count.id / totalOffers) * 100,
    })),
    avgOffersPerTrip,
    exhaustedTrips,
    timeoutRate:
      (offerStats.find((s) => s.status === "EXPIRED")?._count.id || 0) / Math.max(totalOffers, 1),
    rejectionRate:
      (offerStats.find((s) => s.status === "REJECTED")?._count.id || 0) / Math.max(totalOffers, 1),
  };
}
