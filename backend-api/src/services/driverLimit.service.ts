// src/services/driverLimit.service.ts
import {
  updateDriverDailyLimit,
  updateDriversDailyLimit,
  updateFranchiseDriversDailyLimit,
  updateAllDriversDailyLimit,
  getDriverById,
} from "../repositories/driver.repository";
import {
  SetDriverDailyLimitDTO,
  SetDriversDailyLimitDTO,
} from "../types/penalty.dto";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { PENALTY_ERROR_MESSAGES } from "../constants/penalty";
import logger from "../config/logger";
import { UserRole } from "@prisma/client";
import prisma from "../config/prismaClient";

/**
 * Set daily limit for a specific driver
 */
export async function setDriverDailyLimit(
  driverId: string,
  input: SetDriverDailyLimitDTO
): Promise<{ message: string; driverId: string; dailyTargetAmount: number }> {
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError(PENALTY_ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  await updateDriverDailyLimit(driverId, input.dailyTargetAmount);

  logger.info("Driver daily limit updated", {
    driverId,
    dailyTargetAmount: input.dailyTargetAmount,
  });

  return {
    message: "Daily limit updated successfully",
    driverId,
    dailyTargetAmount: input.dailyTargetAmount,
  };
}

/**
 * Set daily limit for multiple drivers
 * Can filter by driverIds, franchiseId, or apply to all drivers
 */
export async function setDriversDailyLimit(
  input: SetDriversDailyLimitDTO,
  userRole: UserRole,
  userFranchiseId?: string
): Promise<{ message: string; count: number; dailyTargetAmount: number }> {
  let count = 0;

  // Manager can only update drivers in their franchise
  if (userRole === UserRole.MANAGER) {
    if (!userFranchiseId) {
      throw new BadRequestError(PENALTY_ERROR_MESSAGES.FRANCHISE_REQUIRED);
    }

    if (input.driverIds && input.driverIds.length > 0) {
      // Verify all drivers belong to manager's franchise
      const drivers = await Promise.all(
        input.driverIds.map((id) => getDriverById(id))
      );

      const invalidDrivers = drivers.filter(
        (d) => !d || d.franchiseId !== userFranchiseId
      );

      if (invalidDrivers.length > 0) {
        throw new BadRequestError(
          "Some drivers do not belong to your franchise"
        );
      }

      const result = await updateDriversDailyLimit(
        input.driverIds,
        input.dailyTargetAmount
      );
      count = result.count;
    } else {
      // Update all drivers in manager's franchise
      const result = await updateFranchiseDriversDailyLimit(
        userFranchiseId,
        input.dailyTargetAmount
      );
      count = result.count;
    }
  } else if (userRole === UserRole.ADMIN) {
    // Admin can update any drivers
    if (input.driverIds && input.driverIds.length > 0) {
      const result = await updateDriversDailyLimit(
        input.driverIds,
        input.dailyTargetAmount
      );
      count = result.count;
    } else if (input.franchiseId) {
      // Update all drivers in specific franchise
      const result = await updateFranchiseDriversDailyLimit(
        input.franchiseId,
        input.dailyTargetAmount
      );
      count = result.count;
    } else {
      // Update all active drivers
      const result = await updateAllDriversDailyLimit(input.dailyTargetAmount);
      count = result.count;
    }
  } else {
    throw new BadRequestError("Only ADMIN and MANAGER can set daily limits");
  }

  logger.info("Drivers daily limit updated", {
    count,
    dailyTargetAmount: input.dailyTargetAmount,
    driverIds: input.driverIds,
    franchiseId: input.franchiseId,
  });

  return {
    message: `Daily limit updated for ${count} driver(s)`,
    count,
    dailyTargetAmount: input.dailyTargetAmount,
  };
}
