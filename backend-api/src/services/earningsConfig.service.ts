// src/services/earningsConfig.service.ts
import {
  getDriverEarningsConfig,
  upsertDriverEarningsConfig,
  DriverEarningsConfigData,
} from "../repositories/earningsConfig.repository";

/**
 * Get driver earnings configuration
 */
export async function getEarningsConfig() {
  try {
    const config = await getDriverEarningsConfig();
    
    if (!config) {
      // Return default config if none exists
      return {
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
    }

    return config;
  } catch (error: any) {
    // If table doesn't exist, return default config
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return {
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
    }
    throw error;
  }
}

/**
 * Update driver earnings configuration
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
