import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";

// ============================================
// CLOCK IN DTO
// ============================================

export const clockInSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type ClockInDTO = z.infer<typeof clockInSchema>;

// ============================================
// CLOCK OUT DTO
// ============================================

export const clockOutSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type ClockOutDTO = z.infer<typeof clockOutSchema>;

// ============================================
// ATTENDANCE QUERY DTO
// ============================================

export const listAttendanceQuerySchema = z.object({
  userId: z.string().uuid("Invalid user ID format").optional(),
  driverId: z.string().uuid("Invalid driver ID format").optional(),
  staffId: z.string().uuid("Invalid staff ID format").optional(),
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 10),
});

export type ListAttendanceQueryDTO = z.infer<typeof listAttendanceQuerySchema>;

// ============================================
// ATTENDANCE PAGINATION QUERY DTO
// ============================================

export const attendancePaginationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  limit: z.string().optional().default("10").transform((val) => parseInt(val, 10)).pipe(z.number().int().positive().max(100)),
  driverId: z.string().uuid("Invalid driver ID format").optional(),
  staffId: z.string().uuid("Invalid staff ID format").optional(),
  userId: z.string().uuid("Invalid user ID format").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  franchiseId: z.string().uuid("Invalid franchise ID format").optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
});

export type AttendancePaginationQueryDTO = z.infer<typeof attendancePaginationQuerySchema>;

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

export interface AttendanceSessionDTO {
  id: string;
  clockIn: Date;
  clockOut: Date | null;
  durationMinutes: number | null;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
}

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
  firstOnlineAt: Date | null;
  lastOfflineAt: Date | null;
  totalOnlineMinutes: number | null;
  totalSessions: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  Driver?: any;
  Staff?: any;
  User?: any;
  Sessions?: AttendanceSessionDTO[];
  totalWorkHours?: string;
  tripsCompleted?: number;
}

export interface SingleAttendanceResponseDTO {
  success: true;
  message: string;
  data: AttendanceResponseDTO;
}

export interface AttendanceListResponseDTO {
  success: true;
  message: string;
  data: AttendanceResponseDTO[];
  pagination?: PaginationDTO;
}export interface AttendanceSessionDTO {
  id: string;
  clockIn: Date;
  clockOut: Date | null;
  durationMinutes: number | null;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
}

export interface ClockAttendanceResponseDTO {
  id: string;
  date: Date;
  loginTime: Date | null;
  clockIn: Date | null;
  clockOut: Date | null;
  status: AttendanceStatus;
  driverId?: string;
  staffId?: string;
  userId?: string;
}

export interface AttendancePaginationQueryDTO {
  page: number;
  limit: number;
  driverId?: string;
  staffId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedAttendanceResponseDTO {
  success: boolean;
  message: string;
  data: AttendanceResponseDTO[];
  pagination: PaginationDTO;
}

export interface AttendanceMonitorRow {
  id: string;
  driverId: string | null;
  staffId: string | null;
  userId: string | null;
  name: string;
  status: string;
  clockIn: Date | null;
  clockOut: Date | null;
  totalDuration: number | null;
  onlineStatus: 'online' | 'offline';
  lastSeen: Date | null;
}

export interface AttendanceMonitorResponse {
  online: number;
  offline: number;
  present: number;
  absent: number;
  rows: AttendanceMonitorRow[];
}

export interface AttendanceStatusDTO {
  clockedIn: boolean;
  clockInTime: Date | null;
  lastClockOutTime: Date | null;
  status: string;
  attendanceId: string | null;
  online?: number;
  offline?: number;
  present?: number;
  absent?: number;
}

export interface UpdateAttendanceStatusDTO {
  status: AttendanceStatus;
  notes?: string;
}

export interface CreateAttendanceDTO {
  driverId?: string;
  staffId?: string;
  userId?: string;
  date: Date;
  loginTime?: Date;
  clockIn?: Date;
  clockOut?: Date;
  status: AttendanceStatus;
  notes?: string;
}

export interface UpdateAttendanceDTO {
  loginTime?: Date;
  clockIn?: Date;
  clockOut?: Date;
  status?: AttendanceStatus;
  notes?: string;

}

// ============================================
// CREATE ATTENDANCE SCHEMA
// ============================================

export const createAttendanceSchema = z.object({
  driverId: z.string().uuid("Invalid driver ID format").optional(),
  staffId: z.string().uuid("Invalid staff ID format").optional(),
  userId: z.string().uuid("Invalid user ID format").optional(),
  date: z.string().transform((val) => new Date(val)),
  loginTime: z.string().transform((val) => new Date(val)).optional(),
  clockIn: z.string().transform((val) => new Date(val)).optional(),
  clockOut: z.string().transform((val) => new Date(val)).optional(),
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().optional(),
});

export type CreateAttendanceDTOType = z.infer<typeof createAttendanceSchema>;

// ============================================
// UPDATE ATTENDANCE SCHEMA
// ============================================

export const updateAttendanceSchema = z.object({
  loginTime: z.string().transform((val) => new Date(val)).optional(),
  clockIn: z.string().transform((val) => new Date(val)).optional(),
  clockOut: z.string().transform((val) => new Date(val)).optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  notes: z.string().optional(),
});

export type UpdateAttendanceDTOType = z.infer<typeof updateAttendanceSchema>;

// ============================================
// UPDATE ATTENDANCE STATUS SCHEMA
// ============================================

export const updateAttendanceStatusSchema = z.object({
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().optional(),
});

export type UpdateAttendanceStatusDTOType = z.infer<typeof updateAttendanceStatusSchema>;
