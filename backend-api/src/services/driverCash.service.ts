// src/services/driverCash.service.ts
import {
  resetCashInHand,
  getDriverDailyLimitInfo,
  submitCashForSettlement as repoSubmitCashForSettlement,
  getDriverById,
} from "../repositories/driver.repository";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { ERROR_MESSAGES } from "../constants/errors";
import logger from "../config/logger";

/**
 * Submit cash to company (reset cash in hand to zero)
 */
export async function submitCashToCompany(driverId: string) {
  const driver = await resetCashInHand(driverId);
  
  logger.info("Cash submitted to company", {
    driverId,
    previousCash: driver.cashInHand,
  });

  return {
    driverId: driver.id,
    message: "Cash submitted to company successfully",
    cashInHand: 0,
  };
}

/**
 * Get driver daily limit information
 */
export async function getDriverDailyLimit(driverId: string) {
  return getDriverDailyLimitInfo(driverId);
}

/**
 * Submit cash for settlement (reduce cash in hand by specified amount)
 */
export async function submitCashForSettlement(
  driverId: string,
  settlementAmount: number
) {
  // Validate driver exists
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  const currentCash = Number(driver.cashInHand) || 0;

  // Validate settlement amount
  if (settlementAmount <= 0) {
    throw new BadRequestError("Settlement amount must be greater than zero");
  }

  if (settlementAmount > currentCash) {
    throw new BadRequestError(
      `Insufficient cash in hand. Available: ${currentCash.toFixed(2)}, Requested: ${settlementAmount.toFixed(2)}`
    );
  }

  // Submit cash for settlement
  const updatedDriver = await repoSubmitCashForSettlement(driverId, settlementAmount);
  const newCash = Number(updatedDriver.cashInHand) || 0;

  logger.info("Cash submitted for settlement", {
    driverId,
    previousCash: currentCash,
    settlementAmount,
    remainingCash: newCash,
  });

  return {
    driverId: driver.id,
    driverName: `${driver.firstName} ${driver.lastName}`,
    message: "Cash submitted for settlement successfully",
    previousCash: currentCash,
    settlementAmount,
    remainingCash: newCash,
  };
}
