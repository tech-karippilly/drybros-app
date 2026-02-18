import { z } from "zod";

// ============================================
// STAFF STATUS ENUM
// ============================================

export enum StaffStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  FIRED = "FIRED",
  BLOCKED = "BLOCKED",
}

// ============================================
// STAFF ROLE ENUM
// ============================================

export enum StaffRole {
  OFFICE_STAFF = "OFFICE_STAFF",
  STAFF = "STAFF",
}

// ============================================
// CREATE STAFF DTO
// ============================================

export const createStaffSchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(), // Required for ADMIN
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  monthlySalary: z.number().min(0, "Salary must be non-negative"),
  address: z.string().max(500, "Address too long").optional(),
  emergencyContact: z.string().max(100, "Emergency contact too long").optional(),
  emergencyContactRelation: z.string().max(50, "Relation too long").optional(),
  role: z.nativeEnum(StaffRole).default(StaffRole.OFFICE_STAFF),
});

export type CreateStaffDTO = z.infer<typeof createStaffSchema>;

// ============================================
// UPDATE STAFF DTO
// ============================================

export const updateStaffSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  monthlySalary: z.number().min(0, "Salary must be non-negative").optional(),
  address: z.string().max(500, "Address too long").optional(),
  emergencyContact: z.string().max(100, "Emergency contact too long").optional(),
  emergencyContactRelation: z.string().max(50, "Relation too long").optional(),
  profilePic: z.string().max(500, "Profile pic URL too long").optional(),
});

export type UpdateStaffDTO = z.infer<typeof updateStaffSchema>;

// ============================================
// UPDATE STAFF STATUS DTO
// ============================================

export const updateStaffStatusSchema = z.object({
  status: z.nativeEnum(StaffStatus),
  suspendedUntil: z.string().optional(), // ISO date string for temporary suspension
});

export type UpdateStaffStatusDTO = z.infer<typeof updateStaffStatusSchema>;

// ============================================
// LIST STAFF QUERY DTO
// ============================================

export const listStaffQuerySchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
  status: z.nativeEnum(StaffStatus).optional(),
  search: z.string().optional(), // Search by name or phone
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 10),
});

export type ListStaffQueryDTO = z.infer<typeof listStaffQuerySchema>;

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

export interface StaffResponseDTO {
  id: string;
  franchiseId: string;
  name: string;
  phone: string;
  email: string;
  monthlySalary: number;
  address: string | null;
  emergencyContact: string | null;
  emergencyContactRelation: string | null;
  profilePic: string | null;
  role: StaffRole;
  status: StaffStatus;
  suspendedUntil: Date | null;
  warningCount: number;
  complaintCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations (optional)
  Franchise?: any;
  // Performance summary (optional)
  attendanceSummary?: {
    totalDays: number;
    presentDays: number;
    attendancePercentage: number;
  };
}

export interface SingleStaffResponseDTO {
  success: true;
  message: string;
  data: StaffResponseDTO;
}

export interface StaffListResponseDTO {
  success: true;
  message: string;
  data: StaffResponseDTO[];
  pagination?: PaginationDTO;
}

// ============================================
// MY PROFILE RESPONSE DTO (for STAFF viewing own profile)
// ============================================

export interface StaffProfileResponseDTO {
  id: string;
  franchiseId: string;
  name: string;
  phone: string;
  email: string;
  address: string | null;
  emergencyContact: string | null;
  emergencyContactRelation: string | null;
  profilePic: string | null;
  role: StaffRole;
  status: StaffStatus;
  warningCount: number;
  complaintCount: number;
  createdAt: Date;
  // Note: monthlySalary is hidden from self-view
  attendanceSummary?: {
    totalDays: number;
    presentDays: number;
    attendancePercentage: number;
  };
}

export interface MyStaffProfileResponseDTO {
  success: true;
  message: string;
  data: StaffProfileResponseDTO;
}
