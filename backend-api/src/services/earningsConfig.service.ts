// src/services/earningsConfig.service.ts
import {
  getDriverEarningsConfig,
  getDriverEarningsConfigByFranchise,
  getDriverEarningsConfigsByFranchises,
  getDriverEarningsConfigByDriver,
  upsertDriverEarningsConfig,
  upsertFranchiseEarningsConfig,
  upsertDriverEarningsConfigForDrivers,
  DriverEarningsConfigData,
} from "../repositories/earningsConfig.repository";

const DEFAULT_CONFIG = {
  dailyTargetDefault: 1250,
  incentiveTier1Min: 1250,
  incentiveTier1Max: 1550,
  incentiveTier1Type: "full_extra",
  incentiveTier2Min: 1550,
  incentiveTier2Percent: 20,
  monthlyBonusTiers: [
    { minEarnings: 25000, bonus: 3000 },
    { minEarnings: 28000, bonus: 500 },
  ],
  monthlyDeductionTiers: [
    { maxEarnings: 26000, cutPercent: 25 },
    { maxEarnings: 22000, cutPercent: 20 },
  ],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Get driver earnings configuration
 */
export async function getEarningsConfig() {
  try {
    const config = await getDriverEarningsConfig();
    
    if (!config) return { ...DEFAULT_CONFIG };
    return config;
  } catch (error: any) {
    if (error?.code === "P2021" || error?.message?.includes("does not exist"))
      return { ...DEFAULT_CONFIG };
    throw error;
  }
}

/**
 * Get earnings config for a franchise
 */
export async function getEarningsConfigByFranchise(franchiseId: string) {
  try {
    const config = await getDriverEarningsConfigByFranchise(franchiseId);
    if (!config) return { ...DEFAULT_CONFIG, franchiseId };
    return config;
  } catch (error: any) {
    if (error?.code === "P2021" || error?.message?.includes("does not exist"))
      return { ...DEFAULT_CONFIG, franchiseId };
    throw error;
  }
}

/**
 * Get earnings configs for multiple franchises
 */
export async function getEarningsConfigsByFranchises(franchiseIds: string[]) {
  try {
    const configs = await getDriverEarningsConfigsByFranchises(franchiseIds);
    return configs;
  } catch (error: any) {
    if (error?.code === "P2021" || error?.message?.includes("does not exist"))
      return [];
    throw error;
  }
}

/**
 * Get earnings config for a driver
 */
export async function getEarningsConfigByDriver(driverId: string) {
  try {
    const config = await getDriverEarningsConfigByDriver(driverId);
    if (!config) return { ...DEFAULT_CONFIG, driverId };
    return config;
  } catch (error: any) {
    if (error?.code === "P2021" || error?.message?.includes("does not exist"))
      return { ...DEFAULT_CONFIG, driverId };
    throw error;
  }
}

/**
 * Set earnings config for a franchise
 */
export async function setFranchiseEarningsConfig(
  franchiseId: string,
  data: DriverEarningsConfigData,
  updatedBy?: string
) {
  return upsertFranchiseEarningsConfig(franchiseId, { ...data, updatedBy });
}

/**
 * Set earnings config for one or more drivers
 */
export async function setDriverEarningsConfig(
  driverIds: string[],
  data: DriverEarningsConfigData,
  updatedBy?: string
) {
  return upsertDriverEarningsConfigForDrivers(driverIds, { ...data, updatedBy });
}

/**
 * Update driver earnings configuration (global)
 */
export async function updateEarningsConfig(
  data: DriverEarningsConfigData,
  updatedBy?: string
) {
  return upsertDriverEarningsConfig({
    ...data,
    updatedBy,
  });
}
