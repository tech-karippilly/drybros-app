// src/types/complaint.dto.ts
import { z } from "zod";
import { ComplaintStatus, ComplaintPriority, ComplaintResolutionAction } from "@prisma/client";

/** Treat empty string as undefined so optional UUID fields can be omitted via "" */
const optionalUuid = (msg: string) =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().uuid(msg).optional()
  );

/**
 * Zod schema for creating a complaint
 */
export const createComplaintSchema = z
  .object({
    driverId: optionalUuid("Driver ID must be a valid UUID"),
    staffId: optionalUuid("Staff ID must be a valid UUID"),
    customerName: z.string().min(1, "Customer name is required").max(200, "Customer name must be less than 200 characters").trim(),
    tripId: optionalUuid("Trip ID must be a valid UUID"),
    title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters").trim(),
    description: z.string().min(1, "Description is required").max(1000, "Description must be less than 1000 characters").trim(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
  })
  .refine(
    (data) => (data.driverId && !data.staffId) || (!data.driverId && data.staffId),
    {
      message: "Either driverId or staffId must be provided, but not both",
      path: ["driverId", "staffId"],
    }
  );

export type CreateComplaintDTO = z.infer<typeof createComplaintSchema>;

/**
 * Zod schema for updating complaint status.
 * When status is RESOLVED: action (WARNING | FIRE) and reason are required.
 */
export const updateComplaintStatusSchema = z
  .object({
    status: z.enum(["RECEIVED", "IN_PROCESS", "RESOLVED"]),
    resolution: z.string().max(500, "Resolution must be less than 500 characters").optional().nullable(),
    action: z.enum(["WARNING", "FIRE"]).optional(),
    reason: z.string().min(1, "Reason is required when resolving").max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.status !== "RESOLVED") return true;
      return !!(data.action && data.reason);
    },
    { message: "When status is RESOLVED, action (WARNING or FIRE) and reason are required", path: ["action"] }
  );

export type UpdateComplaintStatusDTO = z.infer<typeof updateComplaintStatusSchema>;

/**
 * Complaint response DTO
 */
export interface ComplaintResponseDTO {
  id: string;
  driverId: string | null;
  staffId: string | null;
  customerId: string | null;
  customerName: string;
  tripId: string | null;
  title: string;
  description: string;
  reportedBy: string | null;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolution: string | null;
  resolutionAction: ComplaintResolutionAction | null;
  resolutionReason: string | null;
}

/**
 * Pagination query schema for complaints
 */
export const complaintPaginationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  limit: z.string().optional().default("10").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive().max(100)),
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  staffId: z.string().uuid("Staff ID must be a valid UUID").optional(),
  status: z.enum(["RECEIVED", "IN_PROCESS", "RESOLVED"]).optional(),
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
