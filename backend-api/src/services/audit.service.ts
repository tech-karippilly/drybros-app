import prisma from "../config/prismaClient";
import logger from "../config/logger";

// ============================================
// AUDIT EVENT TYPES
// ============================================

export enum AuditEventType {
  // Authentication
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  PASSWORD_RESET = "PASSWORD_RESET",
  TOKEN_REFRESH = "TOKEN_REFRESH",

  // User Management
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_STATUS_CHANGED = "USER_STATUS_CHANGED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",

  // Driver Management
  DRIVER_CREATED = "DRIVER_CREATED",
  DRIVER_UPDATED = "DRIVER_UPDATED",
  DRIVER_STATUS_CHANGED = "DRIVER_STATUS_CHANGED",
  DRIVER_SUSPENDED = "DRIVER_SUSPENDED",
  DRIVER_FIRED = "DRIVER_FIRED",

  // Staff Management
  STAFF_CREATED = "STAFF_CREATED",
  STAFF_UPDATED = "STAFF_UPDATED",
  STAFF_STATUS_CHANGED = "STAFF_STATUS_CHANGED",
  STAFF_SUSPENDED = "STAFF_SUSPENDED",
  STAFF_FIRED = "STAFF_FIRED",

  // Franchise Management
  FRANCHISE_CREATED = "FRANCHISE_CREATED",
  FRANCHISE_UPDATED = "FRANCHISE_UPDATED",
  FRANCHISE_STATUS_CHANGED = "FRANCHISE_STATUS_CHANGED",
  FRANCHISE_BLOCKED = "FRANCHISE_BLOCKED",

  // Trip Management
  TRIP_CREATED = "TRIP_CREATED",
  TRIP_ASSIGNED = "TRIP_ASSIGNED",
  TRIP_REASSIGNED = "TRIP_REASSIGNED",
  TRIP_STATUS_CHANGED = "TRIP_STATUS_CHANGED",
  TRIP_STARTED = "TRIP_STARTED",
  TRIP_COMPLETED = "TRIP_COMPLETED",
  TRIP_CANCELLED = "TRIP_CANCELLED",

  // Financial
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  PAYMENT_MARKED = "PAYMENT_MARKED",
  PAYROLL_GENERATED = "PAYROLL_GENERATED",
  PAYROLL_REGENERATED = "PAYROLL_REGENERATED",
  PAYROLL_PAID = "PAYROLL_PAID",
  TRANSACTION_CREATED = "TRANSACTION_CREATED",

  // Complaints & Warnings
  COMPLAINT_CREATED = "COMPLAINT_CREATED",
  COMPLAINT_RESOLVED = "COMPLAINT_RESOLVED",
  WARNING_ISSUED = "WARNING_ISSUED",

  // Leave Management
  LEAVE_REQUESTED = "LEAVE_REQUESTED",
  LEAVE_APPROVED = "LEAVE_APPROVED",
  LEAVE_REJECTED = "LEAVE_REJECTED",

  // Security Events
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

// ============================================
// AUDIT LOG INTERFACE
// ============================================

export interface AuditLogData {
  eventType: AuditEventType;
  userId?: string;
  driverId?: string;
  staffId?: string;
  franchiseId?: string;
  tripId?: string;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// CREATE AUDIT LOG
// ============================================

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    const {
      eventType,
      userId,
      driverId,
      staffId,
      franchiseId,
      tripId,
      entityType,
      entityId,
      description,
      metadata,
      ipAddress,
      userAgent,
    } = data;

    // Use ActivityLog table (already exists in schema)
    await prisma.$executeRaw`
      INSERT INTO "ActivityLog" (
        id, action, "entityType", "entityId", "franchiseId",
        "driverId", "staffId", "tripId", "userId",
        description, metadata, "createdAt"
      )
      VALUES (
        gen_random_uuid(),
        ${eventType},
        ${entityType || 'SYSTEM'}::text,
        ${entityId || null},
        ${franchiseId || null}::uuid,
        ${driverId || null}::uuid,
        ${staffId || null}::uuid,
        ${tripId || null}::uuid,
        ${userId || null}::uuid,
        ${description},
        ${JSON.stringify({ ...metadata, ipAddress, userAgent })}::jsonb,
        NOW()
      )
    `;

    logger.info("Audit log created", {
      eventType,
      userId,
      description,
    });
  } catch (error) {
    // Don't throw - audit logging should not break main flow
    logger.error("Failed to create audit log", { error, data });
  }
}

// ============================================
// AUDIT: AUTHENTICATION EVENTS
// ============================================

export async function auditLoginSuccess(
  userId: string,
  role: string,
  ipAddress: string,
  userAgent: string
) {
  await createAuditLog({
    eventType: AuditEventType.LOGIN_SUCCESS,
    userId,
    description: `User logged in successfully (${role})`,
    metadata: { role },
    ipAddress,
    userAgent,
  });
}

export async function auditLoginFailed(
  email: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) {
  await createAuditLog({
    eventType: AuditEventType.LOGIN_FAILED,
    description: `Login failed for ${email}: ${reason}`,
    metadata: { email, reason },
    ipAddress,
    userAgent,
  });
}

// ============================================
// AUDIT: STATUS CHANGES
// ============================================

export async function auditStatusChange(
  entityType: "DRIVER" | "STAFF" | "FRANCHISE",
  entityId: string,
  oldStatus: string,
  newStatus: string,
  userId: string,
  franchiseId?: string
) {
  await createAuditLog({
    eventType: AuditEventType[`${entityType}_STATUS_CHANGED` as keyof typeof AuditEventType],
    userId,
    entityType,
    entityId,
    franchiseId,
    description: `${entityType} status changed from ${oldStatus} to ${newStatus}`,
    metadata: { oldStatus, newStatus },
  });
}

// ============================================
// AUDIT: PAYROLL EVENTS
// ============================================

export async function auditPayrollGeneration(
  driverId: string,
  franchiseId: string,
  month: number,
  year: number,
  amount: number,
  userId: string
) {
  await createAuditLog({
    eventType: AuditEventType.PAYROLL_GENERATED,
    userId,
    driverId,
    franchiseId,
    description: `Payroll generated for driver (Month: ${month}/${year}, Amount: ₹${amount})`,
    metadata: { month, year, amount },
  });
}

export async function auditPayrollRegeneration(
  driverId: string,
  franchiseId: string,
  month: number,
  year: number,
  userId: string
) {
  await createAuditLog({
    eventType: AuditEventType.PAYROLL_REGENERATED,
    userId,
    driverId,
    franchiseId,
    description: `WARNING: Payroll regenerated for driver (Month: ${month}/${year})`,
    metadata: { month, year, warning: "POTENTIAL_DUPLICATE" },
  });
}

export async function auditPayrollPaid(
  driverId: string,
  franchiseId: string,
  payrollId: string,
  amount: number,
  userId: string
) {
  await createAuditLog({
    eventType: AuditEventType.PAYROLL_PAID,
    userId,
    driverId,
    franchiseId,
    entityType: "PAYROLL",
    entityId: payrollId,
    description: `Payroll marked as paid (Amount: ₹${amount})`,
    metadata: { payrollId, amount },
  });
}

// ============================================
// AUDIT: COMPLAINT EVENTS
// ============================================

export async function auditComplaintResolution(
  complaintId: string,
  franchiseId: string,
  action: string,
  userId: string
) {
  await createAuditLog({
    eventType: AuditEventType.COMPLAINT_RESOLVED,
    userId,
    franchiseId,
    entityType: "COMPLAINT",
    entityId: complaintId,
    description: `Complaint resolved with action: ${action}`,
    metadata: { action },
  });
}

export async function auditWarningIssued(
  targetType: "DRIVER" | "STAFF",
  targetId: string,
  franchiseId: string,
  reason: string,
  userId: string
) {
  await createAuditLog({
    eventType: AuditEventType.WARNING_ISSUED,
    userId,
    franchiseId,
    ...(targetType === "DRIVER" ? { driverId: targetId } : { staffId: targetId }),
    description: `Warning issued to ${targetType}: ${reason}`,
    metadata: { targetType, reason },
  });
}

// ============================================
// AUDIT: SECURITY EVENTS
// ============================================

export async function auditSuspiciousActivity(
  description: string,
  ipAddress: string,
  metadata?: Record<string, any>
) {
  await createAuditLog({
    eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
    description: `Suspicious activity detected: ${description}`,
    metadata,
    ipAddress,
  });
}

export async function auditUnauthorizedAccess(
  userId: string,
  resource: string,
  ipAddress: string
) {
  await createAuditLog({
    eventType: AuditEventType.UNAUTHORIZED_ACCESS,
    userId,
    description: `Unauthorized access attempt to: ${resource}`,
    metadata: { resource },
    ipAddress,
  });
}

export async function auditRateLimitExceeded(
  endpoint: string,
  ipAddress: string
) {
  await createAuditLog({
    eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
    description: `Rate limit exceeded for endpoint: ${endpoint}`,
    metadata: { endpoint },
    ipAddress,
  });
}

// ============================================
// QUERY AUDIT LOGS
// ============================================

export async function getAuditLogs(filters: {
  userId?: string;
  driverId?: string;
  franchiseId?: string;
  eventType?: AuditEventType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  try {
    const { userId, driverId, franchiseId, eventType, startDate, endDate, limit = 100 } = filters;

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

    if (franchiseId) {
      conditions.push(`"franchiseId" = $${paramIndex}::uuid`);
      params.push(franchiseId);
      paramIndex++;
    }

    if (eventType) {
      conditions.push(`action = $${paramIndex}`);
      params.push(eventType);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`"createdAt" >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`"createdAt" <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const logs = await prisma.$queryRawUnsafe(`
      SELECT * FROM "ActivityLog"
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `, ...params);

    return logs;
  } catch (error) {
    logger.error("Failed to query audit logs", { error });
    return [];
  }
}
