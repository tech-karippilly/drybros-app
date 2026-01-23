// src/types/attendance.dto.ts
import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";

/**
 * Zod schema for clock in
 */
export const clockInSchema = z.object({
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  staffId: z.string().uuid("Staff ID must be a valid UUID").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().nullable(),
}).refine(
  (data) => (data.driverId && !data.staffId) || (!data.driverId && data.staffId),
  {
    message: "Either driverId or staffId must be provided, but not both",
    path: ["driverId", "staffId"],
  }
);

export type ClockInDTO = z.infer<typeof clockInSchema>;

/**
 * Zod schema for clock out
 */
export const clockOutSchema = z.object({
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  staffId: z.string().uuid("Staff ID must be a valid UUID").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().nullable(),
}).refine(
  (data) => (data.driverId && !data.staffId) || (!data.driverId && data.staffId),
  {
    message: "Either driverId or staffId must be provided, but not both",
    path: ["driverId", "staffId"],
  }
);

export type ClockOutDTO = z.infer<typeof clockOutSchema>;

/**
 * Attendance response DTO
 */
export interface AttendanceResponseDTO {
  id: string;
  driverId: string | null;
  staffId: string | null;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  status: AttendanceStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pagination query schema for attendance
 */
export const attendancePaginationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  limit: z.string().optional().default("10").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive().max(100)),
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  staffId: z.string().uuid("Staff ID must be a valid UUID").optional(),
  startDate: z.string().datetime("Invalid start date format").optional(),
  endDate: z.string().datetime("Invalid end date format").optional(),
});

export type AttendancePaginationQueryDTO = z.infer<typeof attendancePaginationQuerySchema>;

export interface PaginatedAttendanceResponseDTO {
  data: AttendanceResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
