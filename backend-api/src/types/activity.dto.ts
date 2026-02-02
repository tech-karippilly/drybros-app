// src/types/activity.dto.ts
import { z } from "zod";
import { ActivityAction, ActivityEntityType } from "@prisma/client";

/**
 * Pagination query schema for activity logs - only franchiseId filter
 */
export const activityPaginationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  limit: z.string().optional().default("20").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive().max(100)),
  franchiseId: z.string().uuid("Franchise ID must be a valid UUID").optional(),
});

export type ActivityPaginationQueryDTO = z.infer<typeof activityPaginationQuerySchema>;

/**
 * Activity log response DTO
 */
export interface ActivityLogResponseDTO {
  id: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string | null;
  franchiseId: string | null;
  driverId: string | null;
  staffId: string | null;
  tripId: string | null;
  userId: string | null;
  description: string;
  metadata: any;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: Date;
  // Related entity info (optional, populated when needed)
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  franchise?: {
    id: string;
    name: string;
    code: string;
  } | null;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    driverCode: string;
  } | null;
  staff?: {
    id: string;
    name: string;
    email: string;
  } | null;
  trip?: {
    id: string;
    customerName: string;
    status: string;
  } | null;
}

export interface PaginatedActivityLogResponseDTO {
  data: ActivityLogResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
