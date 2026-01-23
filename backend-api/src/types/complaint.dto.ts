// src/types/complaint.dto.ts
import { z } from "zod";
import { ComplaintStatus, ComplaintSeverity } from "@prisma/client";

/**
 * Zod schema for creating a complaint
 */
export const createComplaintSchema = z.object({
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  staffId: z.string().uuid("Staff ID must be a valid UUID").optional(),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters").trim(),
  description: z.string().min(1, "Description is required").max(1000, "Description must be less than 1000 characters").trim(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().default("MEDIUM"),
}).refine(
  (data) => (data.driverId && !data.staffId) || (!data.driverId && data.staffId),
  {
    message: "Either driverId or staffId must be provided, but not both",
    path: ["driverId", "staffId"],
  }
);

export type CreateComplaintDTO = z.infer<typeof createComplaintSchema>;

/**
 * Zod schema for updating complaint status
 */
export const updateComplaintStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  resolution: z.string().max(500, "Resolution must be less than 500 characters").optional().nullable(),
});

export type UpdateComplaintStatusDTO = z.infer<typeof updateComplaintStatusSchema>;

/**
 * Complaint response DTO
 */
export interface ComplaintResponseDTO {
  id: string;
  driverId: string | null;
  staffId: string | null;
  title: string;
  description: string;
  reportedBy: string | null;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolution: string | null;
}

/**
 * Pagination query schema for complaints
 */
export const complaintPaginationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  limit: z.string().optional().default("10").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive().max(100)),
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  staffId: z.string().uuid("Staff ID must be a valid UUID").optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
});

export type ComplaintPaginationQueryDTO = z.infer<typeof complaintPaginationQuerySchema>;

export interface PaginatedComplaintResponseDTO {
  data: ComplaintResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
