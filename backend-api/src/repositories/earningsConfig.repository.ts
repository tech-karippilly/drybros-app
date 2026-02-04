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

function configPayload(data: DriverEarningsConfigData) {
  return {
    dailyTargetDefault: data.dailyTargetDefault ?? 1250,
    incentiveTier1Min: data.incentiveTier1Min ?? 1250,
    incentiveTier1Max: data.incentiveTier1Max ?? 1550,
    incentiveTier1Type: data.incentiveTier1Type ?? "full_extra",
    incentiveTier2Min: data.incentiveTier2Min ?? 1550,
    incentiveTier2Percent: data.incentiveTier2Percent ?? 20,
    monthlyBonusTiers: data.monthlyBonusTiers ?? null,
    monthlyDeductionTiers: data.monthlyDeductionTiers ?? null,
    updatedBy: data.updatedBy ?? null,
  };
}

function handleConfigError(error: any) {
  if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
    const err: any = new Error(
      "DriverEarningsConfig table does not exist. Please run database migration."
    );
    err.statusCode = 500;
    throw err;
  }
  throw error;
}

/**
 * Get active global driver earnings config (no franchise, no driver)
 */
export async function getDriverEarningsConfig() {
  try {
    return await prisma.driverEarningsConfig.findFirst({
      where: { isActive: true, franchiseId: null, driverId: null },
    });
  } catch (error: any) {
    if (
      error?.code === "P2021" ||
      error?.message?.includes("does not exist") ||
      error?.message?.includes("findFirst")
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Get active config for a franchise
 */
export async function getDriverEarningsConfigByFranchise(franchiseId: string) {
  try {
    return await prisma.driverEarningsConfig.findFirst({
      where: { isActive: true, franchiseId, driverId: null },
    });
  } catch (error: any) {
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      return null;
    }
    throw error;
  }
}

/**
 * Get configs for multiple franchises
 */
export async function getDriverEarningsConfigsByFranchises(franchiseIds: string[]) {
  try {
    return await prisma.driverEarningsConfig.findMany({
      where: {
        isActive: true,
        franchiseId: { in: franchiseIds },
        driverId: null,
      },
    });
  } catch (error: any) {
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      return [];
    }
    throw error;
  }
}

/**
 * Get active config for a driver
 */
export async function getDriverEarningsConfigByDriver(driverId: string) {
  try {
    return await prisma.driverEarningsConfig.findFirst({
      where: { isActive: true, driverId },
    });
  } catch (error: any) {
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      return null;
    }
    throw error;
  }
}

/**
 * Create or update global driver earnings config
 */
export async function upsertDriverEarningsConfig(data: DriverEarningsConfigData) {
  try {
    const payload = configPayload(data);

    await prisma.driverEarningsConfig.updateMany({
      where: { isActive: true, franchiseId: null, driverId: null },
      data: { isActive: false },
    });

    const created = await prisma.driverEarningsConfig.create({
      data: {
        ...payload,
        franchiseId: null,
        driverId: null,
        isActive: true,
      },
    });

    // Initialize remainingDailyLimit for active drivers that don't have it set
    if (payload.dailyTargetDefault != null) {
      await prisma.driver.updateMany({
        where: { isActive: true, remainingDailyLimit: null },
        data: { remainingDailyLimit: payload.dailyTargetDefault },
      });
    }

    return created;
  } catch (error: any) {
    handleConfigError(error);
  }
}


/**
 * Set earnings config for a franchise
 */
export async function upsertFranchiseEarningsConfig(
  franchiseId: string,
  data: DriverEarningsConfigData
) {
  try {
    const payload = configPayload(data);

    await prisma.driverEarningsConfig.updateMany({
      where: { isActive: true, franchiseId, driverId: null },
      data: { isActive: false },
    });

    const created = await prisma.driverEarningsConfig.create({
      data: {
        ...payload,
        franchiseId,
        driverId: null,
        isActive: true,
      },
    });

    // Initialize remainingDailyLimit for active drivers in this franchise that don't have it set
    if (payload.dailyTargetDefault != null) {
      await prisma.driver.updateMany({
        where: { isActive: true, franchiseId, remainingDailyLimit: null },
        data: { remainingDailyLimit: payload.dailyTargetDefault },
      });
    }

    return created;
  } catch (error: any) {
    handleConfigError(error);
  }
}

/**
 * Set earnings config for one or more drivers (same config applied to each)
 */
export async function upsertDriverEarningsConfigForDrivers(
  driverIds: string[],
  data: DriverEarningsConfigData
) {
  try {
    // Deactivate existing configs for these drivers
    await prisma.driverEarningsConfig.updateMany({
      where: { driverId: { in: driverIds } },
      data: { isActive: false },
    });

    const payload = configPayload(data);
    const created = await Promise.all(
      driverIds.map((driverId) =>
        prisma.driverEarningsConfig.create({
          data: {
            ...payload,
            franchiseId: null,
            driverId,
            isActive: true,
          },
        })
      )
    );

    // Initialize remainingDailyLimit for the specified drivers if they don't have it set
    if (payload.dailyTargetDefault != null && driverIds.length > 0) {
      await prisma.driver.updateMany({
        where: { id: { in: driverIds }, isActive: true, remainingDailyLimit: null },
        data: { remainingDailyLimit: payload.dailyTargetDefault },
      });
    }

    return created;
  } catch (error: any) {
    handleConfigError(error);
  }
}
