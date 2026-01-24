// src/repositories/earningsConfig.repository.ts
import prisma from "../config/prismaClient";

export interface DriverEarningsConfigData {
  dailyTargetDefault?: number;
  incentiveTier1Min?: number;
  incentiveTier1Max?: number;
  incentiveTier1Type?: string;
  incentiveTier2Min?: number;
  incentiveTier2Percent?: number;
  monthlyBonusTiers?: any;
  monthlyDeductionTiers?: any;
  updatedBy?: string;
}

/**
 * Get active driver earnings config
 */
export async function getDriverEarningsConfig() {
  try {
    return await prisma.driverEarningsConfig.findFirst({
      where: { isActive: true },
    });
  } catch (error: any) {
    // If table doesn't exist yet, return null
    if (error?.code === 'P2021' || error?.message?.includes('does not exist') || error?.message?.includes('findFirst')) {
      return null;
    }
    throw error;
  }
}

/**
 * Create or update driver earnings config
 */
export async function upsertDriverEarningsConfig(data: DriverEarningsConfigData) {
  try {
    // Deactivate existing configs
    await prisma.driverEarningsConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new active config
    return await prisma.driverEarningsConfig.create({
      data: {
        dailyTargetDefault: data.dailyTargetDefault ?? 1250,
        incentiveTier1Min: data.incentiveTier1Min ?? 1250,
        incentiveTier1Max: data.incentiveTier1Max ?? 1550,
        incentiveTier1Type: data.incentiveTier1Type ?? "full_extra",
        incentiveTier2Min: data.incentiveTier2Min ?? 1550,
        incentiveTier2Percent: data.incentiveTier2Percent ?? 20,
        monthlyBonusTiers: data.monthlyBonusTiers ?? null,
        monthlyDeductionTiers: data.monthlyDeductionTiers ?? null,
        updatedBy: data.updatedBy ?? null,
        isActive: true,
      },
    });
  } catch (error: any) {
    // If table doesn't exist, throw a more helpful error
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      const err: any = new Error("DriverEarningsConfig table does not exist. Please run database migration.");
      err.statusCode = 500;
      throw err;
    }
    throw error;
  }
}
