import { z } from "zod";
import { ComplaintStatus, ComplaintPriority, ComplaintResolutionAction } from "@prisma/client";

// ============================================
// CREATE COMPLAINT DTO
// ============================================

export const createComplaintSchema = z.object({
  driverId: z.string().uuid("Invalid driver ID format").optional(),
  staffId: z.string().uuid("Invalid staff ID format").optional(),
  tripId: z.string().uuid("Invalid trip ID format").optional(),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  priority: z.nativeEnum(ComplaintPriority).optional().default("MEDIUM"),
}).refine(
  (data) => data.driverId || data.staffId,
  {
    message: "Either driverId or staffId is required",
    path: ["driverId"],
  }
);

export type CreateComplaintDTO = z.infer<typeof createComplaintSchema>;

// ============================================
// UPDATE COMPLAINT STATUS DTO
// ============================================

export const updateComplaintStatusSchema = z.object({
  status: z.enum(["IN_PROCESS", "RESOLVED"]),
});

export type UpdateComplaintStatusDTO = z.infer<typeof updateComplaintStatusSchema>;

// ============================================
// RESOLVE COMPLAINT DTO
// ============================================

export const resolveComplaintSchema = z.object({
  resolution: z.string().min(1, "Resolution is required").max(2000, "Resolution too long"),
  resolutionAction: z.nativeEnum(ComplaintResolutionAction),
  resolutionReason: z.string().max(500, "Reason too long").optional(),
}).refine(
  (data) => {
    // If WARNING or FIRE, reason is required
    if (data.resolutionAction === "WARNING" || data.resolutionAction === "FIRE") {
      return !!data.resolutionReason && data.resolutionReason.length > 0;
    }
    return true;
  },
  {
    message: "Resolution reason is required for WARNING or FIRE actions",
    path: ["resolutionReason"],
  }
);

export type ResolveComplaintDTO = z.infer<typeof resolveComplaintSchema>;

// ============================================
// LIST COMPLAINTS QUERY DTO
// ============================================

export const listComplaintsQuerySchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
  driverId: z.string().uuid("Invalid driver ID format").optional(),
  staffId: z.string().uuid("Invalid staff ID format").optional(),
  customerId: z.string().uuid("Invalid customer ID format").optional(),
  status: z.nativeEnum(ComplaintStatus).optional(),
  priority: z.nativeEnum(ComplaintPriority).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 10),
});

export type ListComplaintsQueryDTO = z.infer<typeof listComplaintsQuerySchema>;

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
  // Relations (optional)
  Driver?: any;
  Staff?: any;
  Customer?: any;
  Trip?: any;
}

export interface SingleComplaintResponseDTO {
  success: true;
  message: string;
  data: ComplaintResponseDTO;
}

export interface ComplaintListResponseDTO {
  success: true;
  message: string;
  data: ComplaintResponseDTO[];
  pagination?: PaginationDTO;
}

// ============================================
// WARNING DTOs
// ============================================

export const listWarningsQuerySchema = z.object({
  driverId: z.string().uuid("Invalid driver ID format").optional(),
  staffId: z.string().uuid("Invalid staff ID format").optional(),
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 10),
});

export type ListWarningsQueryDTO = z.infer<typeof listWarningsQuerySchema>;

export interface WarningResponseDTO {
  id: string;
  driverId: string | null;
  staffId: string | null;
  reason: string;
  priority: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  Driver?: any;
  Staff?: any;
}

export interface WarningListResponseDTO {
  success: true;
  message: string;
  data: WarningResponseDTO[];
  pagination?: PaginationDTO;
}
