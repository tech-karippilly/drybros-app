// src/services/dashboard.service.ts
import {
  getTotalDriversCount,
  getTotalStaffCount,
  getStaffOnLeaveCount,
  getDriversOnLeaveCount,
  getTripsThisMonthCount,
  getActiveTripsCount,
  getProgressTripsCount,
  getActiveCustomersCount,
} from "../repositories/dashboard.repository";

export interface DashboardMetrics {
  totalDrivers: number;
  totalStaff: number;
  staffOnLeave: number;
  driversOnLeave: number;
  tripsThisMonth: number;
  activeTrips: number;
  progressTrips: number;
  activeCustomers: number;
}

/**
 * Get all dashboard metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Fetch all metrics in parallel for better performance
  const [
    totalDrivers,
    totalStaff,
    staffOnLeave,
    driversOnLeave,
    tripsThisMonth,
    activeTrips,
    progressTrips,
    activeCustomers,
  ] = await Promise.all([
    getTotalDriversCount(),
    getTotalStaffCount(),
    getStaffOnLeaveCount(),
    getDriversOnLeaveCount(),
    getTripsThisMonthCount(),
    getActiveTripsCount(),
    getProgressTripsCount(),
    getActiveCustomersCount(),
  ]);

  return {
    totalDrivers,
    totalStaff,
    staffOnLeave,
    driversOnLeave,
    tripsThisMonth,
    activeTrips,
    progressTrips,
    activeCustomers,
  };
}
