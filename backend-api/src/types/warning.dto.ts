// src/types/warning.dto.ts
import { z } from "zod";
import { WarningPriority } from "@prisma/client";

/** Treat empty string as undefined so optional UUID fields can be omitted via "" */
const optionalUuid = (msg: string) =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().uuid(msg).optional()
  );

/**
 * Zod schema for creating a warning
 */
export const createWarningSchema = z
  .object({
    driverId: optionalUuid("Driver ID must be a valid UUID"),
    staffId: optionalUuid("Staff ID must be a valid UUID"),
    reason: z.string().min(1, "Reason is required").max(500, "Reason must be less than 500 characters").trim(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
  })
  .refine(
    (data) => (data.driverId && !data.staffId) || (!data.driverId && data.staffId),
    {
      message: "Either driverId or staffId must be provided, but not both",
      path: ["driverId", "staffId"],
    }
  );

export type CreateWarningDTO = z.infer<typeof createWarningSchema>;

/**
 * Warning response DTO
 */
export interface WarningResponseDTO {
  id: string;
  driverId: string | null;
  staffId: string | null;
  reason: string;
  priority: WarningPriority;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    driverCode: string;
    warningCount: number;
  };
  staff?: {
    id: string;
    name: string;
    email: string;
    warningCount: number;
  };
}

/**
 * Pagination query schema for warnings
 */
export const warningPaginationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  limit: z.string().optional().default("10").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive().max(100)),
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  staffId: z.string().uuid("Staff ID must be a valid UUID").optional(),
});

export type WarningPaginationQueryDTO = z.infer<typeof warningPaginationQuerySchema>;

export interface PaginatedWarningResponseDTO {
  data: WarningResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
