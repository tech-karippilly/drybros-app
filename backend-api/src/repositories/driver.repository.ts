// src/repositories/driver.repository.ts
import prisma from "../config/prismaClient";
import { Driver, DriverStatus, DriverEmploymentType } from "@prisma/client";
import {
  getDriverEarningsConfigByDriver,
  getDriverEarningsConfigByFranchise,
  getDriverEarningsConfig,
} from "./earningsConfig.repository";

export async function getAllDrivers(includeInactive: boolean = false, franchiseId?: string, employmentType?: DriverEmploymentType) {
  const whereClause: any = {};
  
  if (!includeInactive) {
    whereClause.isActive = true;
  }
  
  if (franchiseId) {
    whereClause.franchiseId = franchiseId;
  }

  if (employmentType) {
    whereClause.employmentType = employmentType;
  }

  return prisma.driver.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    orderBy: { id: "asc" },
  });
}

export async function getDriversPaginated(skip: number, take: number, franchiseId?: string, employmentType?: DriverEmploymentType) {
  const whereClause: any = { isActive: true };
  
  if (franchiseId) {
    whereClause.franchiseId = franchiseId;
  }

  if (employmentType) {
    whereClause.employmentType = employmentType;
  }

  // Use Promise.all for parallel execution
  const [data, total] = await Promise.all([
    prisma.driver.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { createdAt: "desc" },
    }),
    prisma.driver.count({
      where: whereClause,
    }),
  ]);

  return { data, total };
}

export async function getDriversWithLocation(franchiseId?: string) {
  const whereClause: any = {
    isActive: true,
    currentLat: { not: null },
    currentLng: { not: null },
  };

  if (franchiseId) {
    whereClause.franchiseId = franchiseId;
  }

  return prisma.driver.findMany({
    where: whereClause,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      currentLat: true,
      currentLng: true,
      locationUpdatedAt: true,
      driverTripStatus: true,
      franchiseId: true,
      driverCode: true,
    },
  });
}

export async function getDriverById(id: string) {
  return prisma.driver.findUnique({
    where: { id },
  });
}

export async function getDriverByPhone(phone: string) {
  return prisma.driver.findUnique({
    where: { phone },
  });
}

export async function getDriverByEmail(email: string) {
  return prisma.driver.findUnique({
    where: { email },
  });
}

export async function getDriverByDriverCode(driverCode: string) {
  return prisma.driver.findUnique({
    where: { driverCode },
  });
}

export async function createDriver(data: {
  franchiseId: string; // UUID
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  altPhone?: string | null;
  driverCode: string;
  password: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  licenseNumber: string;
  licenseExpDate: Date;
  licenseType?: string | null;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  aadharCard: boolean;
  license: boolean;
  educationCert: boolean;
  previousExp: boolean;
  createdBy?: string | null; // User UUID who created this driver
  currentRating?: number;
  employmentType?: DriverEmploymentType | null;
}): Promise<Driver> {
  // Remove fields that don't exist in the Driver model
  const { transmissionTypes, carCategories, carTypes, ...driverData } = data as any;
  
  return prisma.driver.create({
    data: driverData,
  });
}

export async function updateDriver(
  id: string,
  data: {
    franchiseId?: string; // UUID
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    altPhone?: string | null;
    password?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    licenseNumber?: string;
    licenseExpDate?: Date;
      licenseType?: string | null;
    employmentType?: DriverEmploymentType | null;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    aadharCard?: boolean;
    license?: boolean;
    educationCert?: boolean;
    previousExp?: boolean;
    status?: string;
    dailyTargetAmount?: number | null;
    incentive?: number | null;
    bonus?: number | null;
    
  }
): Promise<Driver> {
  // Filter out undefined values and fields that don't exist in Driver model
  const updateData: Record<string, any> = {};
  
  Object.keys(data).forEach((key) => {
    // Skip fields that don't exist in Driver model
    if (key === 'transmissionTypes' || key === 'carCategories' || key === 'carTypes') {
      return;
    }
    if (data[key as keyof typeof data] !== undefined) {
      updateData[key] = data[key as keyof typeof data];
    }
  });

  return prisma.driver.update({
    where: { id },
    data: updateData,
  });
}

export async function updateDriverStatus(
  id: string,
  status: DriverStatus
): Promise<Driver> {
  return prisma.driver.update({
    where: { id },
    data: { status },
  });
}

/** Fire driver (complaint resolution): TERMINATED + blacklisted. Cannot login or register. */
export async function fireDriver(id: string): Promise<Driver> {
  return prisma.driver.update({
    where: { id },
    data: { status: DriverStatus.TERMINATED, blacklisted: true },
  });
}

/** Increment warning count (complaint resolved with WARNING). 2+ warnings trigger auto-fire. */
export async function incrementDriverWarningCount(id: string): Promise<Driver> {
  return prisma.driver.update({
    where: { id },
    data: { warningCount: { increment: 1 } },
  });
}

/** Find blacklisted driver by phone or email (for registration block). */
export async function findBlacklistedDriverByPhoneOrEmail(
  phone: string,
  email: string
): Promise<{ id: string } | null> {
  return prisma.driver.findFirst({
    where: {
      blacklisted: true,
      OR: [{ phone }, { email }],
    },
    select: { id: true },
  });
}

export async function updateDriverTripStatus(
  id: string,
  driverTripStatus: "AVAILABLE" | "ON_TRIP"
): Promise<Driver> {
  return prisma.driver.update({
    where: { id },
    data: { driverTripStatus },
  });
}

export async function updateDriverLiveLocation(
  driverId: string,
  input: {
    lat: number;
    lng: number;
    accuracyM?: number | null;
    capturedAt?: Date;
  }
) {
  return prisma.driver.update({
    where: { id: driverId },
    data: {
      currentLat: input.lat,
      currentLng: input.lng,
      locationAccuracyM: input.accuracyM ?? null,
      locationUpdatedAt: input.capturedAt ?? new Date(),
    },
  });
}

export async function softDeleteDriver(id: string): Promise<Driver> {
  return prisma.driver.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Update daily target amount for a single driver
 */
export async function updateDriverDailyLimit(
  id: string,
  dailyTargetAmount: number
): Promise<Driver> {
  return prisma.driver.update({
    where: { id },
    data: { dailyTargetAmount },
  });
}

/**
 * Update daily target amount for multiple drivers
 */
export async function updateDriversDailyLimit(
  driverIds: string[],
  dailyTargetAmount: number
): Promise<{ count: number }> {
  return prisma.driver.updateMany({
    where: {
      id: { in: driverIds },
    },
    data: { dailyTargetAmount },
  });
}

/**
 * Update daily target amount for all drivers in a franchise
 */
export async function updateFranchiseDriversDailyLimit(
  franchiseId: string,
  dailyTargetAmount: number
): Promise<{ count: number }> {
  return prisma.driver.updateMany({
    where: {
      franchiseId,
      isActive: true,
    },
    data: { dailyTargetAmount },
  });
}

/**
 * Update daily target amount for all active drivers
 */
export async function updateAllDriversDailyLimit(
  dailyTargetAmount: number
): Promise<{ count: number }> {
  return prisma.driver.updateMany({
    where: {
      isActive: true,
    },
    data: { dailyTargetAmount },
  });
}

/**
 * Get drivers with trip data for performance calculation
 * Includes trips from the last 90 days
 */
export async function updateDriverOnlineStatus(
  driverId: string,
  onlineStatus: boolean
): Promise<void> {
  await prisma.driver.update({
    where: { id: driverId },
    data: {
      onlineStatus,
      lastStatusChange: new Date(),
    },
  });
}

export async function getOnlineDrivers(franchiseId?: string) {
  const where: any = {
    onlineStatus: true,
    status: "ACTIVE",
    isActive: true,
  };
  
  if (franchiseId) {
    where.franchiseId = franchiseId;
  }
  
  return await prisma.driver.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      driverCode: true,
      phone: true,
      onlineStatus: true,
      lastStatusChange: true,
      franchiseId: true,
      driverTripStatus: true,
      currentLat: true,
      currentLng: true,
    },
  });
}

export async function getDriversWithTripData(
  includeInactive: boolean = false,
  franchiseId?: string
) {
  const whereClause: any = {};

  if (!includeInactive) {
    whereClause.isActive = true;
  }

  if (franchiseId) {
    whereClause.franchiseId = franchiseId;
  }

  // Calculate performance window (90 days)
  const performanceWindowDate = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  );

  return prisma.driver.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    include: {
      Trip: {
        where: {
          createdAt: {
            gte: performanceWindowDate,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Add cash to driver's cash in hand
 */
export async function addCashInHand(driverId: string, cashAmount: number) {
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) {
    throw new Error("Driver not found");
  }

  const currentCash = Number(driver.cashInHand) || 0;
  const newCash = currentCash + cashAmount;

  return prisma.driver.update({
    where: { id: driverId },
    data: { cashInHand: newCash },
  });
}

/**
 * Get effective daily target for a driver (from config: driver > franchise > global)
 */
async function getEffectiveDailyTarget(driverId: string): Promise<number> {
  const driver = await prisma.driver.findUnique({ 
    where: { id: driverId },
    select: { id: true, franchiseId: true, dailyTargetAmount: true },
  });
  
  if (!driver) {
    throw new Error("Driver not found");
  }

  // Priority: driver-specific config > franchise config > global config > driver.dailyTargetAmount > default
  try {
    // Check driver-specific config
    const driverConfig = await getDriverEarningsConfigByDriver(driverId);
    if (driverConfig?.dailyTargetDefault) {
      return driverConfig.dailyTargetDefault;
    }

    // Check franchise config
    const franchiseConfig = await getDriverEarningsConfigByFranchise(driver.franchiseId);
    if (franchiseConfig?.dailyTargetDefault) {
      return franchiseConfig.dailyTargetDefault;
    }

    // Check global config
    const globalConfig = await getDriverEarningsConfig();
    if (globalConfig?.dailyTargetDefault) {
      return globalConfig.dailyTargetDefault;
    }
  } catch (error) {
    // If config fetch fails, fall back to driver.dailyTargetAmount
  }

  // Fallback to driver's dailyTargetAmount or default
  return driver.dailyTargetAmount || 1250;
}

/**
 * Reduce remaining daily limit by trip amount
 */
export async function reduceRemainingDailyLimit(driverId: string, tripAmount: number) {
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) {
    throw new Error("Driver not found");
  }

  // If remainingDailyLimit is null, initialize it from config's dailyTargetDefault
  let currentLimit: number;
  if (driver.remainingDailyLimit) {
    currentLimit = Number(driver.remainingDailyLimit);
  } else {
    // Initialize from config's dailyTargetDefault
    currentLimit = await getEffectiveDailyTarget(driverId);
  }

  const newLimit = Math.max(0, currentLimit - tripAmount);

  return prisma.driver.update({
    where: { id: driverId },
    data: { remainingDailyLimit: newLimit },
  });
}

/**
 * Reset cash in hand to zero (submit to company)
 */
export async function resetCashInHand(driverId: string) {
  return prisma.driver.update({
    where: { id: driverId },
    data: { cashInHand: 0 },
  });
}

/**
 * Submit cash for settlement (reduce cash in hand by specified amount)
 */
export async function submitCashForSettlement(driverId: string, settlementAmount: number) {
  const driver = await prisma.driver.findUnique({ 
    where: { id: driverId },
    select: { id: true, cashInHand: true },
  });
  
  if (!driver) {
    throw new Error("Driver not found");
  }

  const currentCash = Number(driver.cashInHand) || 0;
  
  if (settlementAmount > currentCash) {
    throw new Error(`Insufficient cash in hand. Available: ${currentCash}, Requested: ${settlementAmount}`);
  }

  if (settlementAmount <= 0) {
    throw new Error("Settlement amount must be greater than zero");
  }

  const newCash = currentCash - settlementAmount;

  return prisma.driver.update({
    where: { id: driverId },
    data: { cashInHand: newCash },
  });
}

/**
 * Reset remaining daily limit for a driver (initialize from config's dailyTargetDefault)
 * Useful for daily reset at start of day
 */
export async function resetRemainingDailyLimit(driverId: string) {
  const dailyTarget = await getEffectiveDailyTarget(driverId);
  return prisma.driver.update({
    where: { id: driverId },
    data: { remainingDailyLimit: dailyTarget },
  });
}

/**
 * Get driver daily limit information
 */
export async function getDriverDailyLimitInfo(driverId: string) {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dailyTargetAmount: true,
      remainingDailyLimit: true,
      cashInHand: true,
    },
  });

  if (!driver) {
    throw new Error("Driver not found");
  }

  // Get effective daily target from config (driver > franchise > global)
  const dailyTarget = await getEffectiveDailyTarget(driverId);
  
  // If remainingDailyLimit is null, initialize it to dailyTarget
  let remainingLimit: number;
  if (driver.remainingDailyLimit) {
    remainingLimit = Number(driver.remainingDailyLimit);
  } else {
    remainingLimit = dailyTarget;
    // Initialize it in the database
    await prisma.driver.update({
      where: { id: driverId },
      data: { remainingDailyLimit: dailyTarget },
    });
  }
  
  const cashInHand = Number(driver.cashInHand) || 0;
  const usedLimit = Math.max(0, dailyTarget - remainingLimit);

  return {
    driverId: driver.id,
    driverName: `${driver.firstName} ${driver.lastName}`,
    dailyTargetAmount: dailyTarget,
    remainingDailyLimit: remainingLimit,
    usedDailyLimit: usedLimit,
    cashInHand: cashInHand,
  };
}
