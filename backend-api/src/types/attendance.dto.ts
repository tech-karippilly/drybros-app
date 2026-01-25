// src/types/attendance.dto.ts
import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";

/**
 * Zod schema for clock in
 */
export const clockInSchema = z.object({
  id: z.string().uuid("ID must be a valid UUID"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().nullable(),
});

export type ClockInDTO = z.infer<typeof clockInSchema>;

/**
 * Zod schema for clock out
 */
export const clockOutSchema = z.object({
  id: z.string().uuid("ID must be a valid UUID"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().nullable(),
});

export type ClockOutDTO = z.infer<typeof clockOutSchema>;

/**
 * Attendance response DTO
 */
export interface AttendanceResponseDTO {
  id: string;
  driverId: string | null;
  staffId: string | null;
  userId: string | null;
  date: Date;
  loginTime: Date | null;
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
  userId: z.string().uuid("User ID must be a valid UUID").optional(),
  startDate: z.string().datetime("Invalid start date format").optional(),
  endDate: z.string().datetime("Invalid end date format").optional(),
});

export type AttendancePaginationQueryDTO = z.infer<typeof attendancePaginationQuerySchema>;

/**
 * Create attendance schema
 */
export const createAttendanceSchema = z.object({
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  staffId: z.string().uuid("Staff ID must be a valid UUID").optional(),
  userId: z.string().uuid("User ID must be a valid UUID").optional(),
  date: z.string().datetime("Invalid date format").or(z.date()),
  loginTime: z.string().datetime("Invalid login time format").optional().nullable(),
  clockIn: z.string().datetime("Invalid clock in time format").optional().nullable(),
  clockOut: z.string().datetime("Invalid clock out time format").optional().nullable(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().nullable(),
}).refine(
  (data) => {
    const count = [data.driverId, data.staffId, data.userId].filter(Boolean).length;
    return count === 1;
  },
  {
    message: "Exactly one of driverId, staffId, or userId must be provided",
    path: ["driverId", "staffId", "userId"],
  }
);

export type CreateAttendanceDTO = z.infer<typeof createAttendanceSchema>;

/**
 * Update attendance schema
 */
export const updateAttendanceSchema = z.object({
  loginTime: z.string().datetime("Invalid login time format").optional().nullable(),
  clockIn: z.string().datetime("Invalid clock in time format").optional().nullable(),
  clockOut: z.string().datetime("Invalid clock out time format").optional().nullable(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().nullable(),
});

export type UpdateAttendanceDTO = z.infer<typeof updateAttendanceSchema>;

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
