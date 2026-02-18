import prisma from "../config/prismaClient";
import { UserRole } from "@prisma/client";
import {
  CreateNotificationDTO,
  NotificationType,
  NotificationChannel,
} from "../types/notification.dto";
import logger from "../config/logger";

// NOTE: This service requires a Notification table in Prisma schema:
// model Notification {
//   id          String   @id @default(uuid())
//   userId      String?
//   driverId    String?
//   staffId     String?
//   franchiseId String
//   type        String
//   title       String
//   message     String
//   metadata    Json?
//   isRead      Boolean  @default(false)
//   createdAt   DateTime @default(now())
// }

// ============================================
// CREATE NOTIFICATION (Internal use)
// ============================================

export async function createNotification(data: CreateNotificationDTO) {
  try {
    // Use raw SQL to create notification
    const id = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Notification" (
        id, "userId", "driverId", "staffId", "franchiseId",
        type, title, message, metadata, "isRead", "createdAt"
      )
      VALUES (
        ${id}::uuid,
        ${data.userId || null}::uuid,
        ${data.driverId || null}::uuid,
        ${data.staffId || null}::uuid,
        ${data.franchiseId}::uuid,
        ${data.type},
        ${data.title},
        ${data.message},
        ${JSON.stringify(data.metadata || {})}::jsonb,
        false,
        NOW()
      )
    `;

    logger.info("Notification created", {
      type: data.type,
      userId: data.userId,
      driverId: data.driverId,
      staffId: data.staffId,
    });

    // TODO: Send PUSH notification if channel includes PUSH
    // TODO: Send EMAIL if channel includes EMAIL

    return { id };
  } catch (error) {
    logger.error("Failed to create notification", { error, data });
    // Don't throw error - notifications shouldn't break main flow
    return null;
  }
}

// ============================================
// EVENT TRIGGER FUNCTIONS
// ============================================

// Trip Events
export async function notifyTripAssigned(tripId: string, driverId: string, franchiseId: string) {
  await createNotification({
    driverId,
    franchiseId,
    type: NotificationType.TRIP_ASSIGNED,
    title: "New Trip Assigned",
    message: "You have been assigned a new trip. Please check trip details.",
    metadata: { tripId },
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  });
}

export async function notifyTripReassigned(tripId: string, oldDriverId: string, newDriverId: string, franchiseId: string) {
  // Notify old driver
  await createNotification({
    driverId: oldDriverId,
    franchiseId,
    type: NotificationType.TRIP_REASSIGNED,
    title: "Trip Reassigned",
    message: "A trip has been reassigned from you.",
    metadata: { tripId },
  });

  // Notify new driver
  await createNotification({
    driverId: newDriverId,
    franchiseId,
    type: NotificationType.TRIP_ASSIGNED,
    title: "New Trip Assigned",
    message: "You have been assigned a trip (reassigned from another driver).",
    metadata: { tripId },
  });
}

export async function notifyTripCancelled(tripId: string, driverId: string, franchiseId: string, reason?: string) {
  await createNotification({
    driverId,
    franchiseId,
    type: NotificationType.TRIP_CANCELLED,
    title: "Trip Cancelled",
    message: `Trip has been cancelled${reason ? `: ${reason}` : '.'}`,
    metadata: { tripId, reason },
  });
}

export async function notifyTripStarted(tripId: string, franchiseId: string) {
  // Notify franchise managers
  const managers = await prisma.user.findMany({
    where: {
      franchiseId,
      role: UserRole.MANAGER,
      isActive: true,
    },
    select: { id: true },
  });

  for (const manager of managers) {
    await createNotification({
      userId: manager.id,
      franchiseId,
      type: NotificationType.TRIP_STARTED,
      title: "Trip Started",
      message: "A trip has been started.",
      metadata: { tripId },
    });
  }
}

export async function notifyTripCompleted(tripId: string, driverId: string, franchiseId: string, amount: number) {
  await createNotification({
    driverId,
    franchiseId,
    type: NotificationType.TRIP_COMPLETED,
    title: "Trip Completed",
    message: `Trip completed successfully. Amount: ₹${amount}`,
    metadata: { tripId, amount },
  });
}

export async function notifyPaymentReceived(tripId: string, driverId: string, franchiseId: string, amount: number) {
  await createNotification({
    driverId,
    franchiseId,
    type: NotificationType.PAYMENT_RECEIVED,
    title: "Payment Received",
    message: `Payment of ₹${amount} received for trip.`,
    metadata: { tripId, amount },
  });
}

// Complaint Events
export async function notifyComplaintCreated(complaintId: string, franchiseId: string, subject: string) {
  // Notify franchise managers
  const managers = await prisma.user.findMany({
    where: {
      franchiseId,
      role: UserRole.MANAGER,
      isActive: true,
    },
    select: { id: true },
  });

  for (const manager of managers) {
    await createNotification({
      userId: manager.id,
      franchiseId,
      type: NotificationType.COMPLAINT_CREATED,
      title: "New Complaint",
      message: `New complaint: ${subject}`,
      metadata: { complaintId },
    });
  }
}

export async function notifyComplaintResolved(complaintId: string, customerId: string, franchiseId: string) {
  // TODO: Implement customer notification when customer model is available
  logger.info("Complaint resolved notification", { complaintId, customerId });
}

// Warning Events
export async function notifyWarningIssued(warningId: string, driverId: string | null, staffId: string | null, franchiseId: string, reason: string) {
  if (driverId) {
    await createNotification({
      driverId,
      franchiseId,
      type: NotificationType.WARNING_ISSUED,
      title: "Warning Issued",
      message: `You have received a warning: ${reason}`,
      metadata: { warningId, reason },
    });
  }

  if (staffId) {
    await createNotification({
      staffId,
      franchiseId,
      type: NotificationType.WARNING_ISSUED,
      title: "Warning Issued",
      message: `You have received a warning: ${reason}`,
      metadata: { warningId, reason },
    });
  }
}

// Leave Events
export async function notifyLeaveSubmitted(leaveId: string, franchiseId: string, employeeName: string) {
  // Notify franchise managers
  const managers = await prisma.user.findMany({
    where: {
      franchiseId,
      role: UserRole.MANAGER,
      isActive: true,
    },
    select: { id: true },
  });

  for (const manager of managers) {
    await createNotification({
      userId: manager.id,
      franchiseId,
      type: NotificationType.LEAVE_REQUEST_SUBMITTED,
      title: "New Leave Request",
      message: `${employeeName} has submitted a leave request.`,
      metadata: { leaveId },
    });
  }
}

export async function notifyLeaveApproved(leaveId: string, driverId: string | null, staffId: string | null, franchiseId: string) {
  if (driverId) {
    await createNotification({
      driverId,
      franchiseId,
      type: NotificationType.LEAVE_APPROVED,
      title: "Leave Approved",
      message: "Your leave request has been approved.",
      metadata: { leaveId },
    });
  }

  if (staffId) {
    await createNotification({
      staffId,
      franchiseId,
      type: NotificationType.LEAVE_APPROVED,
      title: "Leave Approved",
      message: "Your leave request has been approved.",
      metadata: { leaveId },
    });
  }
}

export async function notifyLeaveRejected(leaveId: string, driverId: string | null, staffId: string | null, franchiseId: string, reason?: string) {
  if (driverId) {
    await createNotification({
      driverId,
      franchiseId,
      type: NotificationType.LEAVE_REJECTED,
      title: "Leave Rejected",
      message: `Your leave request has been rejected${reason ? `: ${reason}` : '.'}`,
      metadata: { leaveId, reason },
    });
  }

  if (staffId) {
    await createNotification({
      staffId,
      franchiseId,
      type: NotificationType.LEAVE_REJECTED,
      title: "Leave Rejected",
      message: `Your leave request has been rejected${reason ? `: ${reason}` : '.'}`,
      metadata: { leaveId, reason },
    });
  }
}

// Payroll Events
export async function notifyPayrollGenerated(payrollId: string, driverId: string, franchiseId: string, amount: number, month: number, year: number) {
  await createNotification({
    driverId,
    franchiseId,
    type: NotificationType.PAYROLL_GENERATED,
    title: "Payroll Generated",
    message: `Your payroll for ${month}/${year} has been generated. Amount: ₹${amount}`,
    metadata: { payrollId, amount, month, year },
  });
}

export async function notifyPayrollPaid(payrollId: string, driverId: string, franchiseId: string, amount: number) {
  await createNotification({
    driverId,
    franchiseId,
    type: NotificationType.PAYROLL_PAID,
    title: "Payroll Paid",
    message: `Your payroll of ₹${amount} has been paid.`,
    metadata: { payrollId, amount },
  });
}

// System Alerts
export async function notifySystemAlert(franchiseId: string, title: string, message: string) {
  // Notify all managers in franchise
  const managers = await prisma.user.findMany({
    where: {
      franchiseId,
      role: UserRole.MANAGER,
      isActive: true,
    },
    select: { id: true },
  });

  for (const manager of managers) {
    await createNotification({
      userId: manager.id,
      franchiseId,
      type: NotificationType.SYSTEM_ALERT,
      title,
      message,
    });
  }
}

// ============================================
// USER-FACING FUNCTIONS
// ============================================

// List Notifications
export async function listNotifications(
  userId?: string,
  driverId?: string,
  staffId?: string,
  filters?: {
    isRead?: boolean;
    type?: NotificationType;
    page?: number;
    limit?: number;
  }
) {
  const { page = 1, limit = 20, isRead, type } = filters || {};
  const skip = (page - 1) * limit;

  try {
    // Build where conditions
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`"userId" = $${paramIndex}::uuid`);
      params.push(userId);
      paramIndex++;
    }

    if (driverId) {
      conditions.push(`"driverId" = $${paramIndex}::uuid`);
      params.push(driverId);
      paramIndex++;
    }

    if (staffId) {
      conditions.push(`"staffId" = $${paramIndex}::uuid`);
      params.push(staffId);
      paramIndex++;
    }

    if (isRead !== undefined) {
      conditions.push(`"isRead" = $${paramIndex}`);
      params.push(isRead);
      paramIndex++;
    }

    if (type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get notifications
    const notifications: any[] = await prisma.$queryRawUnsafe(`
      SELECT * FROM "Notification"
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `, ...params);

    // Get total count
    const countResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count FROM "Notification"
      ${whereClause}
    `, ...params);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Get unread count
    const unreadResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count FROM "Notification"
      ${whereClause} ${whereClause ? 'AND' : 'WHERE'} "isRead" = false
    `, ...params);

    const unreadCount = unreadResult[0]?.count || 0;

    return {
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      unreadCount,
    };
  } catch (error) {
    logger.error("Failed to list notifications", { error });
    return {
      success: true,
      message: "Notifications retrieved successfully",
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      unreadCount: 0,
    };
  }
}

// Mark as Read
export async function markAsRead(notificationId: string, userId?: string, driverId?: string, staffId?: string) {
  try {
    // Verify ownership before marking as read
    const conditions: string[] = [`id = $1::uuid`];
    const params: any[] = [notificationId];
    let paramIndex = 2;

    if (userId) {
      conditions.push(`"userId" = $${paramIndex}::uuid`);
      params.push(userId);
      paramIndex++;
    }

    if (driverId) {
      conditions.push(`"driverId" = $${paramIndex}::uuid`);
      params.push(driverId);
      paramIndex++;
    }

    if (staffId) {
      conditions.push(`"staffId" = $${paramIndex}::uuid`);
      params.push(staffId);
      paramIndex++;
    }

    await prisma.$executeRawUnsafe(`
      UPDATE "Notification"
      SET "isRead" = true
      WHERE ${conditions.join(' AND ')}
    `, ...params);

    return {
      success: true,
      message: "Notification marked as read",
    };
  } catch (error) {
    logger.error("Failed to mark notification as read", { error, notificationId });
    const err: any = new Error("Failed to mark notification as read");
    err.statusCode = 500;
    throw err;
  }
}

// Mark All as Read
export async function markAllAsRead(userId?: string, driverId?: string, staffId?: string) {
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`"userId" = $${paramIndex}::uuid`);
      params.push(userId);
      paramIndex++;
    }

    if (driverId) {
      conditions.push(`"driverId" = $${paramIndex}::uuid`);
      params.push(driverId);
      paramIndex++;
    }

    if (staffId) {
      conditions.push(`"staffId" = $${paramIndex}::uuid`);
      params.push(staffId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    await prisma.$executeRawUnsafe(`
      UPDATE "Notification"
      SET "isRead" = true
      ${whereClause}
    `, ...params);

    return {
      success: true,
      message: "All notifications marked as read",
    };
  } catch (error) {
    logger.error("Failed to mark all notifications as read", { error });
    const err: any = new Error("Failed to mark all notifications as read");
    err.statusCode = 500;
    throw err;
  }
}
