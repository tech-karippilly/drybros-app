// src/repositories/activity.repository.ts
import prisma from "../config/prismaClient";
import { ActivityLog, ActivityAction, ActivityEntityType } from "@prisma/client";

export interface CreateActivityLogData {
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId?: string | null;
  franchiseId?: string | null;
  driverId?: string | null;
  staffId?: string | null;
  tripId?: string | null;
  userId?: string | null;
  description: string;
  metadata?: any;
  latitude?: number | null;
  longitude?: number | null;
}

export async function createActivityLog(data: CreateActivityLogData): Promise<ActivityLog> {
  return prisma.activityLog.create({
    data: {
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId || null,
      franchiseId: data.franchiseId || null,
      driverId: data.driverId || null,
      staffId: data.staffId || null,
      tripId: data.tripId || null,
      userId: data.userId || null,
      description: data.description,
      metadata: data.metadata || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    },
  });
}

export interface ActivityLogFilters {
  franchiseId?: string;
  driverId?: string;
  staffId?: string;
  userId?: string;
  tripId?: string;
  entityType?: ActivityEntityType;
  action?: ActivityAction;
}

export async function getActivityLogsPaginated(
  skip: number,
  take: number,
  filters?: ActivityLogFilters
) {
  // Build where clause
  const whereClause: any = {};
  
  if (filters?.franchiseId) whereClause.franchiseId = filters.franchiseId;
  if (filters?.driverId) whereClause.driverId = filters.driverId;
  if (filters?.staffId) whereClause.staffId = filters.staffId;
  if (filters?.userId) whereClause.userId = filters.userId;
  if (filters?.tripId) whereClause.tripId = filters.tripId;
  if (filters?.entityType) whereClause.entityType = filters.entityType;
  if (filters?.action) whereClause.action = filters.action;

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        Franchise: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        Driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            driverCode: true,
          },
        },
        Staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Trip: {
          select: {
            id: true,
            customerName: true,
            status: true,
          },
        },
      },
    }),
    prisma.activityLog.count({ where: whereClause }),
  ]);

  return { data, total };
}

export async function getAllActivityLogs(filters?: ActivityLogFilters) {
  // Build where clause
  const whereClause: any = {};
  
  if (filters?.franchiseId) whereClause.franchiseId = filters.franchiseId;
  if (filters?.driverId) whereClause.driverId = filters.driverId;
  if (filters?.staffId) whereClause.staffId = filters.staffId;
  if (filters?.userId) whereClause.userId = filters.userId;
  if (filters?.tripId) whereClause.tripId = filters.tripId;
  if (filters?.entityType) whereClause.entityType = filters.entityType;
  if (filters?.action) whereClause.action = filters.action;

  return prisma.activityLog.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      Franchise: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
        },
      },
      Staff: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      Trip: {
        select: {
          id: true,
          customerName: true,
          status: true,
        },
      },
    },
  });
}

export async function getActivityLogById(id: string) {
  return prisma.activityLog.findUnique({
    where: { id },
    include: {
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      Franchise: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
        },
      },
      Staff: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      Trip: {
        select: {
          id: true,
          customerName: true,
          status: true,
        },
      },
    },
  });
}

/**
 * Get activity logs for a specific trip
 */
export async function getActivityLogsByTripId(tripId: string) {
  return prisma.activityLog.findMany({
    where: { tripId },
    orderBy: { createdAt: "asc" },
    include: {
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
        },
      },
    },
  });
}
