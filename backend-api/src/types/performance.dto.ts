import { z } from "zod";

// ============================================
// PERFORMANCE GRADE ENUM
// ============================================

export enum PerformanceGrade {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  F = "F",
}

// ============================================
// GENERATE PERFORMANCE DTO
// ============================================

export const generatePerformanceSchema = z.object({
  month: z.number().int().min(1, "Month must be between 1 and 12").max(12, "Month must be between 1 and 12"),
  year: z.number().int().min(2020, "Year must be 2020 or later").max(2100, "Year must be valid"),
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
});

export type GeneratePerformanceDTO = z.infer<typeof generatePerformanceSchema>;

// ============================================
// LIST PERFORMANCE QUERY DTO
// ============================================

export const listPerformanceQuerySchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
  month: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  year: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  driverId: z.string().uuid("Invalid driver ID format").optional(),
  staffId: z.string().uuid("Invalid staff ID format").optional(),
  managerId: z.string().uuid("Invalid manager ID format").optional(),
  grade: z.nativeEnum(PerformanceGrade).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 10),
});

export type ListPerformanceQueryDTO = z.infer<typeof listPerformanceQuerySchema>;

// ============================================
// RESPONSE DTOs
// ============================================

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Driver Performance Response
export interface DriverPerformanceResponseDTO {
  id: string;
  driverId: string;
  franchiseId: string;
  month: number;
  year: number;
  totalTrips: number;
  acceptedTrips: number;
  cancelledTrips: number;
  totalDistance: number;
  totalEarnings: number;
  totalIncentive: number;
  totalPenalty: number;
  monthlyDeduction: number;
  avgRating: number;
  complaintCount: number;
  warningCount: number;
  attendancePercentage: number;
  performanceScore: number;
  grade: PerformanceGrade;
  isFinalized: boolean;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  Driver?: any;
  Franchise?: any;
}

export interface SingleDriverPerformanceResponseDTO {
  success: true;
  message: string;
  data: DriverPerformanceResponseDTO;
}

export interface DriverPerformanceListResponseDTO {
  success: true;
  message: string;
  data: DriverPerformanceResponseDTO[];
  pagination?: PaginationDTO;
}

// Staff Performance Response
export interface StaffPerformanceResponseDTO {
  id: string;
  staffId: string;
  franchiseId: string;
  month: number;
  year: number;
  totalBookingsCreated: number;
  totalAssignments: number;
  reassignmentCount: number;
  complaintsHandled: number;
  unresolvedComplaints: number;
  attendancePercentage: number;
  warningCount: number;
  performanceScore: number;
  grade: PerformanceGrade;
  isFinalized: boolean;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  Staff?: any;
  Franchise?: any;
}

export interface StaffPerformanceListResponseDTO {
  success: true;
  message: string;
  data: StaffPerformanceResponseDTO[];
  pagination?: PaginationDTO;
}

// Manager Performance Response
export interface ManagerPerformanceResponseDTO {
  id: string;
  managerId: string;
  franchiseId: string;
  month: number;
  year: number;
  totalRevenue: number;
  totalTrips: number;
  driverRetentionRate: number;
  staffRetentionRate: number;
  totalComplaints: number;
  resolvedComplaints: number;
  avgDriverRating: number;
  payrollAccuracy: number;
  performanceScore: number;
  grade: PerformanceGrade;
  isFinalized: boolean;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  Manager?: any;
  Franchise?: any;
}

export interface ManagerPerformanceListResponseDTO {
  success: true;
  message: string;
  data: ManagerPerformanceResponseDTO[];
  pagination?: PaginationDTO;
}

// Franchise Performance Response
export interface FranchisePerformanceResponseDTO {
  id: string;
  franchiseId: string;
  month: number;
  year: number;
  totalRevenue: number;
  totalTrips: number;
  activeDrivers: number;
  activeStaff: number;
  totalComplaints: number;
  avgRating: number;
  netProfit: number;
  performanceScore: number;
  grade: PerformanceGrade;
  isFinalized: boolean;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  Franchise?: any;
}

export interface FranchisePerformanceListResponseDTO {
  success: true;
  message: string;
  data: FranchisePerformanceResponseDTO[];
  pagination?: PaginationDTO;
}
