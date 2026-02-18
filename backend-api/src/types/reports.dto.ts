import { z } from "zod";

// ============================================
// COMMON ENUMS
// ============================================

export enum GroupBy {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
}

export enum MetricType {
  REVENUE = "revenue",
  TRIPS = "trips",
  RATING = "rating",
  COMPLAINTS = "complaints",
}

export enum ExportFormat {
  CSV = "csv",
  EXCEL = "excel",
}

// ============================================
// REVENUE ANALYTICS QUERY
// ============================================

export const revenueReportQuerySchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.nativeEnum(GroupBy).optional().default(GroupBy.MONTH),
  export: z.nativeEnum(ExportFormat).optional(),
});

export type RevenueReportQueryDTO = z.infer<typeof revenueReportQuerySchema>;

// ============================================
// TRIP ANALYTICS QUERY
// ============================================

export const tripReportQuerySchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tripType: z.string().optional(),
  carType: z.string().optional(),
  export: z.nativeEnum(ExportFormat).optional(),
});

export type TripReportQueryDTO = z.infer<typeof tripReportQuerySchema>;

// ============================================
// DRIVER ANALYTICS QUERY
// ============================================

export const driverReportQuerySchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID").optional(),
  month: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  year: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  metricType: z.nativeEnum(MetricType).optional().default(MetricType.REVENUE),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  export: z.nativeEnum(ExportFormat).optional(),
});

export type DriverReportQueryDTO = z.infer<typeof driverReportQuerySchema>;

// ============================================
// STAFF ANALYTICS QUERY
// ============================================

export const staffReportQuerySchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID").optional(),
  month: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  year: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  export: z.nativeEnum(ExportFormat).optional(),
});

export type StaffReportQueryDTO = z.infer<typeof staffReportQuerySchema>;

// ============================================
// FRANCHISE ANALYTICS QUERY
// ============================================

export const franchiseReportQuerySchema = z.object({
  month: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  year: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  export: z.nativeEnum(ExportFormat).optional(),
});

export type FranchiseReportQueryDTO = z.infer<typeof franchiseReportQuerySchema>;

// ============================================
// COMPLAINT TRENDS QUERY
// ============================================

export const complaintReportQuerySchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  export: z.nativeEnum(ExportFormat).optional(),
});

export type ComplaintReportQueryDTO = z.infer<typeof complaintReportQuerySchema>;

// ============================================
// ATTENDANCE ANALYTICS QUERY
// ============================================

export const attendanceReportQuerySchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID").optional(),
  role: z.enum(["driver", "staff"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  export: z.nativeEnum(ExportFormat).optional(),
});

export type AttendanceReportQueryDTO = z.infer<typeof attendanceReportQuerySchema>;

// ============================================
// RESPONSE INTERFACES
// ============================================

export interface RevenueReportData {
  summary: {
    totalRevenue: number;
    totalTrips: number;
    averageRevenuePerTrip: number;
    period: string;
  };
  breakdown: Array<{
    label: string; // Date, franchise name, trip type, etc.
    revenue: number;
    trips: number;
    percentage: number;
  }>;
  chartData: Array<{
    date: string;
    revenue: number;
    trips: number;
  }>;
  paymentModeSplit?: {
    upi: number;
    inHand: number;
  };
}

export interface TripReportData {
  summary: {
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    avgTripDuration: number; // minutes
    avgTripDistance: number; // km
    reassignmentRate: number; // percentage
    rescheduleRate: number; // percentage
    driverAcceptanceRate: number; // percentage
  };
  breakdown: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
  chartData: Array<{
    date: string;
    completed: number;
    cancelled: number;
  }>;
}

export interface DriverReportData {
  summary: {
    totalDrivers: number;
    activeDrivers: number;
    avgRating: number;
  };
  topDrivers: Array<{
    driverId: string;
    driverName: string;
    driverCode: string;
    metric: number; // revenue, trips, rating, or complaints based on metricType
    rank: number;
  }>;
  chartData?: Array<{
    name: string;
    value: number;
  }>;
}

export interface StaffReportData {
  summary: {
    totalStaff: number;
    activeStaff: number;
    avgAttendance: number;
  };
  staffMetrics: Array<{
    staffId: string;
    staffName: string;
    bookingsCreated: number;
    assignmentEfficiency: number;
    complaintResolutionRate: number;
    attendancePercentage: number;
    warningCount: number;
  }>;
}

export interface FranchiseReportData {
  summary: {
    totalFranchises: number;
    totalRevenue: number;
    totalTrips: number;
  };
  franchiseComparison: Array<{
    franchiseId: string;
    franchiseName: string;
    revenue: number;
    trips: number;
    complaintRate: number;
    profitabilityIndex: number;
    driverRetentionRate: number;
    staffRetentionRate: number;
  }>;
  chartData: Array<{
    name: string;
    revenue: number;
    trips: number;
  }>;
}

export interface ComplaintReportData {
  summary: {
    totalComplaints: number;
    resolvedComplaints: number;
    avgResolutionTime: number; // hours
  };
  breakdown: Array<{
    label: string; // Month, priority, category
    count: number;
    percentage: number;
  }>;
  chartData: Array<{
    date: string;
    complaints: number;
    resolved: number;
  }>;
}

export interface AttendanceReportData {
  summary: {
    totalRecords: number;
    avgAttendanceRate: number;
    avgOnlineHours: number;
    absenteeRate: number;
    leaveRate: number;
  };
  breakdown: Array<{
    label: string;
    attendanceRate: number;
    avgOnlineHours: number;
  }>;
  chartData: Array<{
    date: string;
    present: number;
    absent: number;
    onLeave: number;
  }>;
}

// ============================================
// STANDARD REPORT RESPONSE
// ============================================

export interface ReportResponseDTO<T> {
  success: true;
  message: string;
  data: T;
  generatedAt: Date;
}
