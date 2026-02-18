// src/services/workingTime.service.ts
import prisma from "../config/prismaClient";
import { NotFoundError, BadRequestError } from "../utils/errors";

export type RoleType = "DRIVER" | "STAFF" | "MANAGER";

export interface CreateWorkingTimeConfigInput {
  franchiseId: string;
  roleType: RoleType;
  minimumWorkHours?: number;
  lunchBreakMinutes?: number;
  snackBreakMinutes?: number;
  gracePeriodMinutes?: number;
  isActive?: boolean;
  createdBy: string;
}

export interface UpdateWorkingTimeConfigInput {
  minimumWorkHours?: number;
  lunchBreakMinutes?: number;
  snackBreakMinutes?: number;
  gracePeriodMinutes?: number;
  isActive?: boolean;
}

export interface WorkingTimeConfigFilters {
  franchiseId?: string;
  roleType?: RoleType;
  isActive?: boolean;
}

/**
 * Get all working time configs with optional filters
 */
export async function getWorkingTimeConfigs(filters?: WorkingTimeConfigFilters) {
  const where: any = {};

  if (filters?.franchiseId) {
    where.franchiseId = filters.franchiseId;
  }

  if (filters?.roleType) {
    where.roleType = filters.roleType;
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  const configs = await prisma.workingTimeConfig.findMany({
    where,
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return configs;
}

/**
 * Get working time config by ID
 */
export async function getWorkingTimeConfigById(id: string) {
  const config = await prisma.workingTimeConfig.findUnique({
    where: { id },
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!config) {
    throw new NotFoundError("Working time configuration not found");
  }

  return config;
}

/**
 * Get working time config by franchise and role type
 */
export async function getWorkingTimeConfigByFranchiseAndRole(
  franchiseId: string,
  roleType: RoleType
) {
  const config = await prisma.workingTimeConfig.findUnique({
    where: {
      franchiseId_roleType: {
        franchiseId,
        roleType,
      },
    },
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  return config;
}

/**
 * Create a new working time config
 */
export async function createWorkingTimeConfig(input: CreateWorkingTimeConfigInput) {
  // Check if config already exists for this franchise and role
  const existingConfig = await prisma.workingTimeConfig.findUnique({
    where: {
      franchiseId_roleType: {
        franchiseId: input.franchiseId,
        roleType: input.roleType,
      },
    },
  });

  if (existingConfig) {
    throw new BadRequestError(
      `Working time configuration already exists for this franchise and role type. Please update the existing configuration.`
    );
  }

  const config = await prisma.workingTimeConfig.create({
    data: {
      franchiseId: input.franchiseId,
      roleType: input.roleType,
      minimumWorkHours: input.minimumWorkHours ?? 8,
      lunchBreakMinutes: input.lunchBreakMinutes ?? 60,
      snackBreakMinutes: input.snackBreakMinutes ?? 15,
      gracePeriodMinutes: input.gracePeriodMinutes ?? 15,
      isActive: input.isActive ?? true,
      createdBy: input.createdBy,
    },
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  return config;
}

/**
 * Update a working time config
 */
export async function updateWorkingTimeConfig(
  id: string,
  input: UpdateWorkingTimeConfigInput
) {
  const existingConfig = await prisma.workingTimeConfig.findUnique({
    where: { id },
  });

  if (!existingConfig) {
    throw new NotFoundError("Working time configuration not found");
  }

  const config = await prisma.workingTimeConfig.update({
    where: { id },
    data: {
      minimumWorkHours: input.minimumWorkHours,
      lunchBreakMinutes: input.lunchBreakMinutes,
      snackBreakMinutes: input.snackBreakMinutes,
      gracePeriodMinutes: input.gracePeriodMinutes,
      isActive: input.isActive,
    },
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  return config;
}

/**
 * Update or create working time config (upsert)
 */
export async function upsertWorkingTimeConfig(input: CreateWorkingTimeConfigInput) {
  const config = await prisma.workingTimeConfig.upsert({
    where: {
      franchiseId_roleType: {
        franchiseId: input.franchiseId,
        roleType: input.roleType,
      },
    },
    update: {
      minimumWorkHours: input.minimumWorkHours,
      lunchBreakMinutes: input.lunchBreakMinutes,
      snackBreakMinutes: input.snackBreakMinutes,
      gracePeriodMinutes: input.gracePeriodMinutes,
      isActive: input.isActive,
    },
    create: {
      franchiseId: input.franchiseId,
      roleType: input.roleType,
      minimumWorkHours: input.minimumWorkHours ?? 8,
      lunchBreakMinutes: input.lunchBreakMinutes ?? 60,
      snackBreakMinutes: input.snackBreakMinutes ?? 15,
      gracePeriodMinutes: input.gracePeriodMinutes ?? 15,
      isActive: input.isActive ?? true,
      createdBy: input.createdBy,
    },
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  return config;
}

/**
 * Delete a working time config
 */
export async function deleteWorkingTimeConfig(id: string) {
  const existingConfig = await prisma.workingTimeConfig.findUnique({
    where: { id },
  });

  if (!existingConfig) {
    throw new NotFoundError("Working time configuration not found");
  }

  await prisma.workingTimeConfig.delete({
    where: { id },
  });

  return { success: true, message: "Working time configuration deleted successfully" };
}

/**
 * Get default working time config (for global fallback)
 */
export function getDefaultWorkingTimeConfig(roleType: RoleType) {
  return {
    roleType,
    minimumWorkHours: 8,
    lunchBreakMinutes: 60,
    snackBreakMinutes: 15,
    gracePeriodMinutes: 15,
    isActive: true,
  };
}

/**
 * Calculate expected work end time based on config
 */
export function calculateExpectedWorkEndTime(
  clockInTime: Date,
  config: { minimumWorkHours: number; lunchBreakMinutes: number }
): Date {
  const endTime = new Date(clockInTime);
  endTime.setHours(endTime.getHours() + config.minimumWorkHours);
  endTime.setMinutes(endTime.getMinutes() + config.lunchBreakMinutes);
  return endTime;
}

/**
 * Check if user is late based on config
 */
export function isLate(
  clockInTime: Date,
  expectedStartTime: Date,
  gracePeriodMinutes: number
): { isLate: boolean; lateByMinutes: number } {
  const graceEndTime = new Date(expectedStartTime);
  graceEndTime.setMinutes(graceEndTime.getMinutes() + gracePeriodMinutes);

  if (clockInTime <= graceEndTime) {
    return { isLate: false, lateByMinutes: 0 };
  }

  const lateByMinutes = Math.floor(
    (clockInTime.getTime() - expectedStartTime.getTime()) / (1000 * 60)
  );

  return { isLate: true, lateByMinutes };
}
