// src/types/leave.dto.ts
import { z } from "zod";
import { LeaveType, LeaveRequestStatus } from "@prisma/client";

/**
 * Helper to transform empty strings to undefined and validate UUID
 */
const optionalUuidField = z.preprocess(
  (val) => {
    if (val === "" || val === null) return undefined;
    return val;
  },
  z.string().uuid().optional()
);

/**
 * Zod schema for creating a leave request
 */
export const createLeaveRequestSchema = z.object({
  driverId: optionalUuidField,
  staffId: optionalUuidField,
  userId: optionalUuidField,
  startDate: z.union([
    z.string().datetime("Invalid date format").transform((val) => new Date(val)),
    z.date(),
  ]),
  endDate: z.union([
    z.string().datetime("Invalid date format").transform((val) => new Date(val)),
    z.date(),
  ]),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be less than 500 characters").trim(),
  leaveType: z.enum(["SICK_LEAVE", "CASUAL_LEAVE", "EARNED_LEAVE", "EMERGENCY_LEAVE", "OTHER"]),
}).refine(
  (data) => {
    const count = [data.driverId, data.staffId, data.userId].filter(Boolean).length;
    return count === 1;
  },
  {
    message: "Exactly one of driverId, staffId, or userId must be provided",
    path: ["driverId", "staffId", "userId"],
  }
).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);

export type CreateLeaveRequestDTO = z.infer<typeof createLeaveRequestSchema>;

/**
 * Helper to transform empty strings to null for rejectionReason
 */
const optionalRejectionReason = z.preprocess(
  (val) => {
    if (val === "" || val === undefined) return null;
    return val;
  },
  z.string().max(500, "Rejection reason must be less than 500 characters").nullable()
);

/**
 * Zod schema for updating leave request status
 */
export const updateLeaveRequestStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]),
  rejectionReason: optionalRejectionReason,
}).refine(
  (data) => {
    // If status is REJECTED, rejectionReason should be provided
    if (data.status === "REJECTED" && !data.rejectionReason) {
      return false;
    }
    return true;
  },
  {
    message: "Rejection reason is required when status is REJECTED",
    path: ["rejectionReason"],
  }
);

export type UpdateLeaveRequestStatusDTO = z.infer<typeof updateLeaveRequestStatusSchema>;

/**
 * Leave request response DTO
 */
export interface LeaveRequestResponseDTO {
  id: string;
  driverId: string | null;
  staffId: string | null;
  userId: string | null;
  startDate: Date;
  endDate: Date;
  reason: string;
  leaveType: LeaveType;
  status: LeaveRequestStatus;
  requestedBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pagination query schema for leave requests
 */
export const leaveRequestPaginationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  limit: z.string().optional().default("10").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive().max(100)),
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  staffId: z.string().uuid("Staff ID must be a valid UUID").optional(),
  userId: z.string().uuid("User ID must be a valid UUID").optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  startDate: z.string().datetime("Invalid start date format").optional(),
  endDate: z.string().datetime("Invalid end date format").optional(),
});

export type LeaveRequestPaginationQueryDTO = z.infer<typeof leaveRequestPaginationQuerySchema>;

export interface PaginatedLeaveRequestResponseDTO {
  data: LeaveRequestResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
