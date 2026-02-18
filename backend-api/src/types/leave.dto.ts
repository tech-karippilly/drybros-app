import { z } from "zod";

// Local enum definitions (until Prisma client regeneration)
export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum LeaveType {
  SICK_LEAVE = "SICK_LEAVE",
  CASUAL_LEAVE = "CASUAL_LEAVE",
  EARNED_LEAVE = "EARNED_LEAVE",
  EMERGENCY_LEAVE = "EMERGENCY_LEAVE",
  OTHER = "OTHER",
}

// ============================================
// CREATE LEAVE REQUEST DTO
// ============================================

export const createLeaveRequestSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end date format",
  }),
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
  leaveType: z.nativeEnum(LeaveType),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  },
  {
    message: "Start date must be before or equal to end date",
    path: ["endDate"],
  }
);

export type CreateLeaveRequestDTO = z.infer<typeof createLeaveRequestSchema>;

// ============================================
// UPDATE LEAVE REQUEST STATUS DTO
// ============================================

export const updateLeaveRequestStatusSchema = z.object({
  status: z.nativeEnum(LeaveStatus),
  rejectionReason: z.string().min(1, "Rejection reason is required").max(500, "Reason too long").optional(),
}).refine(
  (data) => {
    if (data.status === "REJECTED" && !data.rejectionReason) {
      return false;
    }
    return true;
  },
  {
    message: "Rejection reason is required when rejecting",
    path: ["rejectionReason"],
  }
);

export type UpdateLeaveRequestStatusDTO = z.infer<typeof updateLeaveRequestStatusSchema>;

// ============================================
// LIST LEAVE REQUESTS PAGINATION QUERY DTO
// ============================================

export const leaveRequestPaginationQuerySchema = z.object({
  status: z.nativeEnum(LeaveStatus).optional(),
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
  driverId: z.string().uuid("Invalid driver ID format").optional(),
  staffId: z.string().uuid("Invalid staff ID format").optional(),
  userId: z.string().uuid("Invalid user ID format").optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 10),
});

export type LeaveRequestPaginationQueryDTO = z.infer<typeof leaveRequestPaginationQuerySchema>;

// ============================================
// APPROVE LEAVE DTO
// ============================================

export const approveLeaveSchema = z.object({
  // approvedBy will come from JWT, no input needed
});

export type ApproveLeaveDTO = z.infer<typeof approveLeaveSchema>;

// ============================================
// REJECT LEAVE DTO
// ============================================

export const rejectLeaveSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required").max(500, "Reason too long"),
});

export type RejectLeaveDTO = z.infer<typeof rejectLeaveSchema>;

// ============================================
// LIST LEAVE REQUESTS QUERY DTO
// ============================================

export const listLeaveRequestsQuerySchema = z.object({
  status: z.nativeEnum(LeaveStatus).optional(),
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
  driverId: z.string().uuid("Invalid driver ID format").optional(),
  staffId: z.string().uuid("Invalid staff ID format").optional(),
  userId: z.string().uuid("Invalid user ID format").optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 10),
});

export type ListLeaveRequestsQueryDTO = z.infer<typeof listLeaveRequestsQuerySchema>;

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

export interface LeaveRequestResponseDTO {
  id: string;
  driverId: string | null;
  staffId: string | null;
  userId: string | null;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  requestedBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  Driver?: any;
  Staff?: any;
  User?: any;
  ApprovedByUser?: any;
}

export interface SingleLeaveRequestResponseDTO {
  success: true;
  message: string;
  data: LeaveRequestResponseDTO;
}

export interface LeaveRequestListResponseDTO {
  success: true;
  message: string;
  data: LeaveRequestResponseDTO[];
  pagination?: PaginationDTO;
}

export interface PaginatedLeaveRequestResponseDTO {
  data: LeaveRequestResponseDTO[];
  pagination: PaginationDTO;
}
