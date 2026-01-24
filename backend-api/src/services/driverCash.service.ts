// src/services/driverCash.service.ts
import {
  resetCashInHand,
  getDriverDailyLimitInfo,
} from "../repositories/driver.repository";
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
