import { z } from "zod";

// ============================================
// GENERATE PAYROLL DTO
// ============================================

export const generatePayrollSchema = z.object({
  month: z.number().int().min(1, "Month must be between 1 and 12").max(12, "Month must be between 1 and 12"),
  year: z.number().int().min(2020, "Year must be 2020 or later").max(2100, "Year must be valid"),
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
});

export type GeneratePayrollDTO = z.infer<typeof generatePayrollSchema>;

// ============================================
// LIST PAYROLL QUERY DTO
// ============================================

export const listPayrollQuerySchema = z.object({
  month: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  year: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
  driverId: z.string().uuid("Invalid driver ID format").optional(),
  isPaid: z.string().optional().transform(val => val === "true" ? true : val === "false" ? false : undefined),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 10),
});

export type ListPayrollQueryDTO = z.infer<typeof listPayrollQuerySchema>;

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

export interface DriverPayrollResponseDTO {
  id: string;
  driverId: string;
  franchiseId: string;
  month: number;
  year: number;
  totalEarnings: number;
  totalIncentives: number;
  totalPenalties: number;
  monthlyDeduction: number;
  bonuses: number;
  finalPayout: number;
  isPaid: boolean;
  paidAt: Date | null;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  Driver?: any;
  Franchise?: any;
}

export interface SingleDriverPayrollResponseDTO {
  success: true;
  message: string;
  data: DriverPayrollResponseDTO;
}

export interface DriverPayrollListResponseDTO {
  success: true;
  message: string;
  data: DriverPayrollResponseDTO[];
  pagination?: PaginationDTO;
}
