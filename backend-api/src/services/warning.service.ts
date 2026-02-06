// src/services/warning.service.ts
import {
  createWarning as repoCreateWarning,
  getWarningById,
  getWarningsPaginated,
  getAllWarnings,
  deleteWarning as repoDeleteWarning,
} from "../repositories/warning.repository";
import {
  getDriverById,
  fireDriver as repoFireDriver,
  incrementDriverWarningCount as repoIncrementDriverWarningCount,
} from "../repositories/driver.repository";
import {
  getStaffById,
  updateStaffStatus as repoUpdateStaffStatus,
  incrementStaffWarningCount as repoIncrementStaffWarningCount,
} from "../repositories/staff.repository";
import {
  CreateWarningDTO,
  WarningResponseDTO,
  WarningPaginationQueryDTO,
  PaginatedWarningResponseDTO,
} from "../types/warning.dto";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { WARNING_ERROR_MESSAGES, WARNING_THRESHOLD } from "../constants/warning";
import logger from "../config/logger";
import { logActivity } from "./activity.service";
import { ActivityAction, ActivityEntityType } from "@prisma/client";

function mapWarningToResponse(warning: any): WarningResponseDTO {
  return {
    id: warning.id,
    driverId: warning.driverId,
    staffId: warning.staffId,
    reason: warning.reason,
    priority: warning.priority,
    createdBy: warning.createdBy,
    createdAt: warning.createdAt,
    updatedAt: warning.updatedAt,
    driver: warning.Driver ? {
      id: warning.Driver.id,
      firstName: warning.Driver.firstName,
      lastName: warning.Driver.lastName,
      driverCode: warning.Driver.driverCode,
      warningCount: warning.Driver.warningCount,
    } : undefined,
    staff: warning.Staff ? {
      id: warning.Staff.id,
      name: warning.Staff.name,
      email: warning.Staff.email,
      warningCount: warning.Staff.warningCount,
    } : undefined,
  };
}

export async function createWarning(
  input: CreateWarningDTO,
  createdBy?: string
): Promise<{ message: string; data: WarningResponseDTO; autoFired?: boolean }> {
  // Validate that either driverId or staffId is provided
  if (!input.driverId && !input.staffId) {
    throw new BadRequestError(WARNING_ERROR_MESSAGES.INVALID_WARNING_TYPE);
  }

  let targetEntity: any;
  let warningCount = 0;
  let franchiseId: string | undefined;

  // Verify driver or staff exists and get current warning count
  if (input.driverId) {
    const driver = await getDriverById(input.driverId);
    if (!driver) {
      throw new NotFoundError(WARNING_ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }
    targetEntity = driver;
    warningCount = driver.warningCount || 0;
    franchiseId = driver.franchiseId;
  }

  if (input.staffId) {
    const staff = await getStaffById(input.staffId);
    if (!staff) {
      throw new NotFoundError(WARNING_ERROR_MESSAGES.STAFF_NOT_FOUND);
    }
    targetEntity = staff;
    warningCount = staff.warningCount || 0;
    franchiseId = staff.franchiseId;
  }

  // Create warning
  const warning = await repoCreateWarning({
    driverId: input.driverId,
    staffId: input.staffId,
    reason: input.reason,
    priority: input.priority || "MEDIUM",
    createdBy: createdBy || null,
  });

  // Increment warning count
  if (input.driverId) {
    await repoIncrementDriverWarningCount(input.driverId).catch((err) => {
      logger.error("Failed to increment driver warning count", { error: err });
    });
  } else if (input.staffId) {
    await repoIncrementStaffWarningCount(input.staffId).catch((err) => {
      logger.error("Failed to increment staff warning count", { error: err });
    });
  }

  const newWarningCount = warningCount + 1;
  let autoFired = false;

  // Check if threshold reached (3 warnings = auto-fire)
  if (newWarningCount >= WARNING_THRESHOLD) {
    if (input.driverId) {
      const driver = await getDriverById(input.driverId);
      if (driver && !driver.blacklisted && driver.status !== "TERMINATED") {
        await repoFireDriver(input.driverId);
        autoFired = true;
        logger.info("Driver auto-fired due to warnings threshold", {
          driverId: input.driverId,
          warningCount: newWarningCount,
          warningId: warning.id,
        });
      }
    } else if (input.staffId) {
      const staff = await getStaffById(input.staffId);
      if (staff && staff.status !== "FIRED") {
        await repoUpdateStaffStatus(input.staffId, "FIRED");
        autoFired = true;
        logger.info("Staff auto-fired due to warnings threshold", {
          staffId: input.staffId,
          warningCount: newWarningCount,
          warningId: warning.id,
        });
      }
    }
  }

  logger.info("Warning created", {
    warningId: warning.id,
    driverId: input.driverId,
    staffId: input.staffId,
    warningCount: newWarningCount,
    autoFired,
  });

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.WARNING_ISSUED,
    entityType: input.driverId ? ActivityEntityType.DRIVER : ActivityEntityType.STAFF,
    entityId: input.driverId || input.staffId || null,
    franchiseId: franchiseId || null,
    driverId: input.driverId || null,
    staffId: input.staffId || null,
    userId: createdBy || null,
    description: `Warning issued: ${input.reason}${autoFired ? " (Auto-fired)" : ""}`,
    metadata: {
      warningId: warning.id,
      reason: input.reason,
      priority: input.priority,
      warningCount: newWarningCount,
      autoFired,
    },
  }).catch((err) => {
    logger.error("Failed to log warning activity", { error: err });
  });

  return {
    message: autoFired
      ? `Warning issued successfully. ${input.driverId ? "Driver" : "Staff"} has been automatically fired due to ${WARNING_THRESHOLD} warnings.`
      : "Warning issued successfully",
    data: mapWarningToResponse(warning),
    autoFired,
  };
}

export async function listWarnings(
  filters?: { driverId?: string; staffId?: string }
): Promise<WarningResponseDTO[]> {
  const warnings = await getAllWarnings(filters as any);
  return warnings.map(mapWarningToResponse);
}

export async function listWarningsPaginated(
  pagination: WarningPaginationQueryDTO
): Promise<PaginatedWarningResponseDTO> {
  const { page, limit, driverId, staffId } = pagination;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (driverId) filters.driverId = driverId;
  if (staffId) filters.staffId = staffId;

  const { data, total } = await getWarningsPaginated(skip, limit, filters);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapWarningToResponse),
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

export async function getWarning(id: string): Promise<WarningResponseDTO> {
  const warning = await getWarningById(id);
  if (!warning) {
    throw new NotFoundError(WARNING_ERROR_MESSAGES.WARNING_NOT_FOUND);
  }
  return mapWarningToResponse(warning);
}

export async function deleteWarning(id: string): Promise<{ message: string }> {
  const warning = await getWarningById(id);
  if (!warning) {
    throw new NotFoundError(WARNING_ERROR_MESSAGES.WARNING_NOT_FOUND);
  }

  await repoDeleteWarning(id);

  logger.info("Warning deleted", { warningId: id });

  return {
    message: "Warning deleted successfully",
  };
}
