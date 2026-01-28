// src/services/notification.service.ts
import { socketService, NotificationPayload } from "./socket.service";
import logger from "../config/logger";

export interface CreateNotificationData {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "trip" | "complaint" | "leave" | "attendance";
  userId?: string;
  driverId?: string;
  staffId?: string;
  franchiseId?: string;
  metadata?: any;
}

/**
 * Emit a notification via socket
 * This is a utility function that can be called from anywhere in the application
 */
export async function emitNotification(data: CreateNotificationData): Promise<void> {
  try {
    const notification: NotificationPayload = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: data.title,
      message: data.message,
      type: data.type,
      userId: data.userId,
      driverId: data.driverId,
      staffId: data.staffId,
      franchiseId: data.franchiseId,
      read: false,
      createdAt: new Date(),
    };

    socketService.emitNotification(notification);

    logger.debug("Notification emitted", {
      notificationId: notification.id,
      type: notification.type,
      userId: notification.userId,
      driverId: notification.driverId,
    });
  } catch (error) {
    // Log error but don't throw - notification emission should not break main functionality
    logger.error("Failed to emit notification", {
      error: error instanceof Error ? error.message : String(error),
      title: data.title,
      type: data.type,
    });
  }
}

/**
 * Emit notification for trip events
 */
export async function emitTripNotification(
  tripId: string,
  title: string,
  message: string,
  driverId?: string,
  franchiseId?: string
): Promise<void> {
  await emitNotification({
    title,
    message,
    type: "trip",
    driverId,
    franchiseId,
    metadata: { tripId },
  });
}

/**
 * Emit notification for complaint events
 */
export async function emitComplaintNotification(
  complaintId: string,
  title: string,
  message: string,
  userId?: string,
  driverId?: string,
  franchiseId?: string
): Promise<void> {
  await emitNotification({
    title,
    message,
    type: "complaint",
    userId,
    driverId,
    franchiseId,
    metadata: { complaintId },
  });
}

/**
 * Emit notification for leave request events
 */
export async function emitLeaveNotification(
  leaveId: string,
  title: string,
  message: string,
  staffId?: string,
  userId?: string,
  franchiseId?: string
): Promise<void> {
  await emitNotification({
    title,
    message,
    type: "leave",
    staffId,
    userId,
    franchiseId,
    metadata: { leaveId },
  });
}
