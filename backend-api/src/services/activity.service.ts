// src/services/activity.service.ts
import {
  createActivityLog as repoCreateActivityLog,
  getActivityLogsPaginated as repoGetActivityLogsPaginated,
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
import { socketService } from "./socket.service";

/**
 * Create an activity log entry
 * This is a utility function that can be called from anywhere in the application
 */
export async function logActivity(data: CreateActivityLogData): Promise<void> {
  try {
    const activityLog = await repoCreateActivityLog(data);
    
    // Emit socket event for the new activity log
    socketService.emitActivityLog({
      id: activityLog.id,
      action: activityLog.action,
      entityType: activityLog.entityType,
      entityId: activityLog.entityId || undefined,
      franchiseId: activityLog.franchiseId || undefined,
      driverId: activityLog.driverId || undefined,
      staffId: activityLog.staffId || undefined,
      tripId: activityLog.tripId || undefined,
      userId: activityLog.userId || undefined,
      description: activityLog.description,
      metadata: activityLog.metadata || undefined,
      latitude: activityLog.latitude || undefined,
      longitude: activityLog.longitude || undefined,
      createdAt: activityLog.createdAt,
    });
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
    latitude: activityLog.latitude,
    longitude: activityLog.longitude,
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
 * Get activity logs filtered by franchiseId only
 */
export async function getActivityLogs(
  userRole: UserRole,
  userId: string | undefined,
  userFranchiseId: string | undefined,
  filters?: {
    franchiseId?: string;
  }
): Promise<ActivityLogResponseDTO[]> {
  const whereClause: any = {};

  // Role-based franchiseId filtering
  switch (userRole) {
    case UserRole.ADMIN:
      // Admin can see all activities, optionally filtered by franchiseId
      if (filters?.franchiseId) {
        whereClause.franchiseId = filters.franchiseId;
      }
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
      // Staff sees activities of their franchise
      if (userFranchiseId) {
        whereClause.franchiseId = userFranchiseId;
      } else if (filters?.franchiseId) {
        whereClause.franchiseId = filters.franchiseId;
      }
      break;

    case UserRole.DRIVER:
      // Driver sees activities of their franchise
      if (userFranchiseId) {
        whereClause.franchiseId = userFranchiseId;
      } else if (filters?.franchiseId) {
        whereClause.franchiseId = filters.franchiseId;
      }
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
  const { page, limit, franchiseId } = pagination;
  const skip = (page - 1) * limit;

  // Build filters - only franchiseId
  const filters: any = {};
  
  // Role-based franchiseId filtering
  switch (userRole) {
    case UserRole.ADMIN:
      // Admin can see all activities, optionally filtered by franchiseId
      if (franchiseId) {
        filters.franchiseId = franchiseId;
      }
      break;

    case UserRole.MANAGER:
      // Manager sees all activities of their franchise
      if (!userFranchiseId) {
        throw new Error("Manager must have a franchiseId");
      }
      filters.franchiseId = userFranchiseId;
      break;

    case UserRole.OFFICE_STAFF:
    case UserRole.STAFF:
      // Staff sees activities of their franchise
      if (userFranchiseId) {
        filters.franchiseId = userFranchiseId;
      } else if (franchiseId) {
        filters.franchiseId = franchiseId;
      }
      break;

    case UserRole.DRIVER:
      // Driver sees activities of their franchise
      if (userFranchiseId) {
        filters.franchiseId = userFranchiseId;
      } else if (franchiseId) {
        filters.franchiseId = franchiseId;
      }
      break;
  }

  const { data, total } = await repoGetActivityLogsPaginated(skip, limit, filters);

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
