import { z } from "zod";

// ============================================
// NOTIFICATION TYPE ENUM
// ============================================

export enum NotificationType {
  TRIP_ASSIGNED = "TRIP_ASSIGNED",
  TRIP_REASSIGNED = "TRIP_REASSIGNED",
  TRIP_CANCELLED = "TRIP_CANCELLED",
  TRIP_STARTED = "TRIP_STARTED",
  TRIP_COMPLETED = "TRIP_COMPLETED",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  COMPLAINT_CREATED = "COMPLAINT_CREATED",
  COMPLAINT_RESOLVED = "COMPLAINT_RESOLVED",
  WARNING_ISSUED = "WARNING_ISSUED",
  LEAVE_REQUEST_SUBMITTED = "LEAVE_REQUEST_SUBMITTED",
  LEAVE_APPROVED = "LEAVE_APPROVED",
  LEAVE_REJECTED = "LEAVE_REJECTED",
  PAYROLL_GENERATED = "PAYROLL_GENERATED",
  PAYROLL_PAID = "PAYROLL_PAID",
  SYSTEM_ALERT = "SYSTEM_ALERT",
}

// ============================================
// NOTIFICATION CHANNEL ENUM
// ============================================

export enum NotificationChannel {
  IN_APP = "IN_APP",
  PUSH = "PUSH",
  SMS = "SMS",
  EMAIL = "EMAIL",
}

// ============================================
// LIST NOTIFICATIONS QUERY DTO
// ============================================

export const listNotificationsQuerySchema = z.object({
  isRead: z.string().optional().transform(val => val === "true" ? true : val === "false" ? false : undefined),
  type: z.nativeEnum(NotificationType).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 20),
});

export type ListNotificationsQueryDTO = z.infer<typeof listNotificationsQuerySchema>;

// ============================================
// CREATE NOTIFICATION DTO (Internal use only)
// ============================================

export interface CreateNotificationDTO {
  userId?: string;
  driverId?: string;
  staffId?: string;
  franchiseId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  channels?: NotificationChannel[];
}

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

export interface NotificationResponseDTO {
  id: string;
  userId: string | null;
  driverId: string | null;
  staffId: string | null;
  franchiseId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, any> | null;
  isRead: boolean;
  createdAt: Date;
}

export interface SingleNotificationResponseDTO {
  success: true;
  message: string;
  data: NotificationResponseDTO;
}

export interface NotificationListResponseDTO {
  success: true;
  message: string;
  data: NotificationResponseDTO[];
  pagination?: PaginationDTO;
  unreadCount?: number;
}
