// src/types/activity.dto.ts
import { z } from "zod";
import { ActivityAction, ActivityEntityType } from "@prisma/client";

/**
 * Pagination query schema for activity logs
 */
export const activityPaginationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  limit: z.string().optional().default("20").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive().max(100)),
  franchiseId: z.string().uuid("Franchise ID must be a valid UUID").optional(),
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  staffId: z.string().uuid("Staff ID must be a valid UUID").optional(),
  tripId: z.string().uuid("Trip ID must be a valid UUID").optional(),
  action: z.enum([
    "TRIP_CREATED", "TRIP_ASSIGNED", "TRIP_ACCEPTED", "TRIP_REJECTED", "TRIP_STARTED", "TRIP_ENDED", "TRIP_CANCELLED", "TRIP_STATUS_CHANGED", "TRIP_UPDATED",
    "DRIVER_CREATED", "DRIVER_UPDATED", "DRIVER_STATUS_CHANGED", "DRIVER_CLOCK_IN", "DRIVER_CLOCK_OUT",
    "STAFF_CREATED", "STAFF_UPDATED", "STAFF_STATUS_CHANGED", "STAFF_CLOCK_IN", "STAFF_CLOCK_OUT",
    "COMPLAINT_CREATED", "COMPLAINT_RESOLVED", "COMPLAINT_STATUS_CHANGED",
    "LEAVE_REQUESTED", "LEAVE_APPROVED", "LEAVE_REJECTED", "LEAVE_CANCELLED",
    "RATING_SUBMITTED", "ATTENDANCE_RECORDED",
    "CUSTOMER_CREATED", "CUSTOMER_UPDATED", "FRANCHISE_CREATED", "FRANCHISE_UPDATED", "FRANCHISE_STATUS_CHANGED"
  ]).optional(),
  entityType: z.enum(["TRIP", "DRIVER", "STAFF", "CUSTOMER", "FRANCHISE", "COMPLAINT", "LEAVE_REQUEST", "RATING", "ATTENDANCE", "OTHER"]).optional(),
  startDate: z.string().datetime("Invalid start date format").optional(),
  endDate: z.string().datetime("Invalid end date format").optional(),
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
