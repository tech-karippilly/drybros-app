// src/services/activity.service.ts
import {
  createActivityLog as repoCreateActivityLog,
  getActivityLogsPaginated,
  getAllActivityLogs,
  getActivityLogById,
  CreateActivityLogData,
} from "../repositories/activity.repository";
import { getDriverById } from "../repositories/driver.repository";
import { getStaffById } from "../repositories/staff.repository";
import { getTripById } from "../repositories/trip.repository";
import prisma from "../config/prismaClient";
import { UserRole, ActivityAction, ActivityEntityType } from "@prisma/client";
import {
  ActivityLogResponseDTO,
  ActivityPaginationQueryDTO,
  PaginatedActivityLogResponseDTO,
} from "../types/activity.dto";
import { NotFoundError } from "../utils/errors";
import { ACTIVITY_ERROR_MESSAGES } from "../constants/activity";
import logger from "../config/logger";

/**
 * Create an activity log entry
 * This is a utility function that can be called from anywhere in the application
 */
export async function logActivity(data: CreateActivityLogData): Promise<void> {
  try {
    await repoCreateActivityLog(data);
  } catch (error) {
    // Log error but don't throw - activity logging should not break main functionality
    logger.error("Failed to create activity log", {
      error: error instanceof Error ? error.message : String(error),
      action: data.action,
      entityType: data.entityType,
    });
  }
}

function mapActivityLogToResponse(activityLog: any): ActivityLogResponseDTO {
  return {
    id: activityLog.id,
    action: activityLog.action,
    entityType: activityLog.entityType,
    entityId: activityLog.entityId,
    franchiseId: activityLog.franchiseId,
    driverId: activityLog.driverId,
    staffId: activityLog.staffId,
    tripId: activityLog.tripId,
    userId: activityLog.userId,
    description: activityLog.description,
    metadata: activityLog.metadata,
    createdAt: activityLog.createdAt,
    user: activityLog.User ? {
      id: activityLog.User.id,
      fullName: activityLog.User.fullName,
      email: activityLog.User.email,
      role: activityLog.User.role,
    } : null,
    franchise: activityLog.Franchise ? {
      id: activityLog.Franchise.id,
      name: activityLog.Franchise.name,
      code: activityLog.Franchise.code,
    } : null,
    driver: activityLog.Driver ? {
      id: activityLog.Driver.id,
      firstName: activityLog.Driver.firstName,
      lastName: activityLog.Driver.lastName,
      driverCode: activityLog.Driver.driverCode,
    } : null,
    staff: activityLog.Staff ? {
      id: activityLog.Staff.id,
      name: activityLog.Staff.name,
      email: activityLog.Staff.email,
    } : null,
    trip: activityLog.Trip ? {
      id: activityLog.Trip.id,
      customerName: activityLog.Trip.customerName,
      status: activityLog.Trip.status,
    } : null,
  };
}

/**
 * Get activity logs with role-based filtering
 */
export async function getActivityLogs(
  userRole: UserRole,
  userId?: string,
  userFranchiseId?: string,
  filters?: {
    franchiseId?: string;
    driverId?: string;
    staffId?: string;
    tripId?: string;
    action?: ActivityAction;
    entityType?: ActivityEntityType;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ActivityLogResponseDTO[]> {
  let whereClause: any = { ...filters };

  // Role-based filtering
  switch (userRole) {
    case UserRole.ADMIN:
      // Admin can see all activities, optionally filtered by franchiseId
      // Filters already applied above
      break;

    case UserRole.MANAGER:
      // Manager sees all activities of their franchise
      if (!userFranchiseId) {
        throw new Error("Manager must have a franchiseId");
      }
      whereClause.franchiseId = userFranchiseId;
      break;

    case UserRole.OFFICE_STAFF:
    case UserRole.STAFF:
      // Staff sees driver activities and trip creations
      whereClause.OR = [
        { entityType: "DRIVER" },
        { action: { in: ["TRIP_CREATED", "TRIP_UPDATED", "TRIP_ASSIGNED"] } },
      ];
      if (userFranchiseId) {
        whereClause.franchiseId = userFranchiseId;
      }
      // Remove other filters that conflict with OR - they'll be applied via AND
      delete whereClause.entityType;
      delete whereClause.action;
      break;

    case UserRole.DRIVER:
      // Driver sees only trip-related activities
      whereClause.OR = [
        { entityType: "TRIP" },
        { action: { in: ["TRIP_ASSIGNED", "TRIP_ACCEPTED", "TRIP_REJECTED", "TRIP_STARTED", "TRIP_ENDED", "TRIP_CANCELLED"] } },
      ];
      if (filters?.driverId) {
        whereClause.driverId = filters.driverId;
      }
      // Remove other filters that conflict with OR - they'll be applied via AND
      delete whereClause.entityType;
      delete whereClause.action;
      break;

    default:
      // Default: no activities
      return [];
  }

  const activityLogs = await getAllActivityLogs(whereClause);
  return activityLogs.map(mapActivityLogToResponse);
}

export async function getActivityLogsPaginated(
  userRole: UserRole,
  userId: string | undefined,
  userFranchiseId: string | undefined,
  pagination: ActivityPaginationQueryDTO
): Promise<PaginatedActivityLogResponseDTO> {
  const { page, limit, franchiseId, driverId, staffId, tripId, action, entityType, startDate, endDate } = pagination;
  const skip = (page - 1) * limit;

  // Build filters based on role
  const filters: any = {};
  
  // Role-based filtering
  switch (userRole) {
    case UserRole.ADMIN:
      if (franchiseId) filters.franchiseId = franchiseId;
      break;

    case UserRole.MANAGER:
      if (!userFranchiseId) {
        throw new Error("Manager must have a franchiseId");
      }
      filters.franchiseId = userFranchiseId;
      break;

    case UserRole.OFFICE_STAFF:
    case UserRole.STAFF:
      if (userFranchiseId) {
        filters.franchiseId = userFranchiseId;
      }
      // Staff sees driver activities and trip creations - will add OR condition
      filters.OR = [
        { entityType: "DRIVER" },
        { action: { in: ["TRIP_CREATED", "TRIP_UPDATED", "TRIP_ASSIGNED"] } },
      ];
      // Remove action and entityType from filters since they're in OR
      if (action) delete filters.action;
      if (entityType) delete filters.entityType;
      break;

    case UserRole.DRIVER:
      // Driver sees only trip-related activities - will add OR condition
      filters.OR = [
        { entityType: "TRIP" },
        { action: { in: ["TRIP_ASSIGNED", "TRIP_ACCEPTED", "TRIP_REJECTED", "TRIP_STARTED", "TRIP_ENDED", "TRIP_CANCELLED"] } },
      ];
      if (driverId) {
        filters.driverId = driverId;
      }
      // Remove action and entityType from filters since they're in OR
      if (action) delete filters.action;
      if (entityType) delete filters.entityType;
      break;
  }

  // Apply additional filters (only if not in OR condition)
  if (driverId && userRole !== UserRole.DRIVER && !filters.OR) {
    filters.driverId = driverId;
  }
  if (staffId && !filters.OR) filters.staffId = staffId;
  if (tripId) filters.tripId = tripId;
  if (action && !filters.OR) filters.action = action;
  if (entityType && !filters.OR) filters.entityType = entityType;
  if (startDate) filters.startDate = new Date(startDate);
  if (endDate) filters.endDate = new Date(endDate);

  // For STAFF and DRIVER roles, we need custom filtering with OR conditions
  let whereClause: any = { ...filters };
  
  if (userRole === UserRole.OFFICE_STAFF || userRole === UserRole.STAFF) {
    // Staff sees driver activities and trip creations
    whereClause.OR = [
      { entityType: "DRIVER" },
      { action: { in: ["TRIP_CREATED", "TRIP_UPDATED", "TRIP_ASSIGNED"] } },
    ];
  } else if (userRole === UserRole.DRIVER) {
    // Driver sees only trip-related activities
    whereClause.OR = [
      { entityType: "TRIP" },
      { action: { in: ["TRIP_ASSIGNED", "TRIP_ACCEPTED", "TRIP_REJECTED", "TRIP_STARTED", "TRIP_ENDED", "TRIP_CANCELLED"] } },
    ];
  }

  const { data, total } = await getActivityLogsPaginated(skip, limit, whereClause);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapActivityLogToResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
}

export async function getActivityLog(id: string): Promise<ActivityLogResponseDTO> {
  const activityLog = await getActivityLogById(id);
  if (!activityLog) {
    throw new NotFoundError(ACTIVITY_ERROR_MESSAGES.ACTIVITY_NOT_FOUND);
  }
  return mapActivityLogToResponse(activityLog);
}
