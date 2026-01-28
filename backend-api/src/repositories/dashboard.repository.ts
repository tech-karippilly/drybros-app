// src/repositories/dashboard.repository.ts
import prisma from "../config/prismaClient";
import { LeaveRequestStatus } from "@prisma/client";

/**
 * Get total count of active drivers
 */
export async function getTotalDriversCount(): Promise<number> {
  return prisma.driver.count({
    where: {
      isActive: true,
    },
  });
}

/**
 * Get total count of active staff
 */
export async function getTotalStaffCount(): Promise<number> {
  return prisma.staff.count({
    where: {
      isActive: true,
    },
  });
}

/**
 * Get count of staff currently on leave (approved leave requests that overlap with today)
 */
export async function getStaffOnLeaveCount(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Count distinct staff with approved leave requests that overlap with today
  const result = await prisma.leaveRequest.groupBy({
    by: ["staffId"],
    where: {
      status: LeaveRequestStatus.APPROVED,
      staffId: { not: null },
      startDate: { lte: tomorrow },
      endDate: { gte: today },
    },
  });

  return result.length;
}

/**
 * Get count of drivers currently on leave (approved leave requests that overlap with today)
 */
export async function getDriversOnLeaveCount(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Count distinct drivers with approved leave requests that overlap with today
  const result = await prisma.leaveRequest.groupBy({
    by: ["driverId"],
    where: {
      status: LeaveRequestStatus.APPROVED,
      driverId: { not: null },
      startDate: { lte: tomorrow },
      endDate: { gte: today },
    },
  });

  return result.length;
}

/**
 * Get count of trips created this month
 */
export async function getTripsThisMonthCount(): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  return prisma.trip.count({
    where: {
      createdAt: {
        gte: startOfMonth,
      },
    },
  });
}

/**
 * Get count of active trips (trips that are assigned, started, or in progress)
 */
export async function getActiveTripsCount(): Promise<number> {
  return prisma.trip.count({
    where: {
      status: {
        in: [
          "ASSIGNED",
          "DRIVER_ACCEPTED",
          "TRIP_STARTED",
          "TRIP_PROGRESS",
          "IN_PROGRESS",
          "DRIVER_ON_THE_WAY",
        ],
      },
    },
  });
}

/**
 * Get count of trips in progress (trips that are currently being executed)
 */
export async function getProgressTripsCount(): Promise<number> {
  return prisma.trip.count({
    where: {
      status: {
        in: ["TRIP_PROGRESS", "IN_PROGRESS", "TRIP_STARTED"],
      },
    },
  });
}

/**
 * Get count of active customers (customers who have at least one trip)
 */
export async function getActiveCustomersCount(): Promise<number> {
  // Count customers who have at least one trip
  return prisma.customer.count({
    where: {
      Trip: {
        some: {},
      },
    },
  });
}
