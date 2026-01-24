// src/services/driverEarnings.service.ts
import prisma from "../config/prismaClient";
import { TripStatus, PaymentStatus } from "@prisma/client";
import { getDriverById } from "../repositories/driver.repository";
import { getEarningsConfig } from "./earningsConfig.service";
import { getDriverPenaltiesPaginated } from "../repositories/driverPenalty.repository";

/**
 * Get daily earnings stats for a driver
 */
export async function getDriverDailyStats(driverId: string, date?: string) {
  // Validate driver exists
  const driver = await getDriverById(driverId);
  if (!driver) {
    const err: any = new Error("Driver not found");
    err.statusCode = 404;
    throw err;
  }

  // Parse date or use today
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Get completed trips for the day
  const trips = await prisma.trip.findMany({
    where: {
      driverId,
      status: {
        in: [TripStatus.TRIP_ENDED, TripStatus.COMPLETED, TripStatus.PAYMENT_DONE],
      },
      paymentStatus: PaymentStatus.COMPLETED,
      endedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      finalAmount: true,
      totalAmount: true,
    },
  });

  // Calculate daily stats
  const amountRunToday = trips.reduce((sum, trip) => sum + (trip.finalAmount || trip.totalAmount || 0), 0);
  const tripsCountToday = trips.length;
  const dailyTarget = driver.dailyTargetAmount || 1250; // Default if not set

  // Get earnings config
  const config = await getEarningsConfig();

  // Calculate daily incentive
  let incentiveToday = 0;
  let incentiveType: string | null = null;

  // Tier 1: If daily amount is between tier1Min and tier1Max (inclusive)
  // Tier 1 is always "full_extra" - amount above target
  if (amountRunToday >= config.incentiveTier1Min && amountRunToday <= config.incentiveTier1Max) {
    if (config.incentiveTier1Type === "full_extra") {
      // Full extra: amount above target
      incentiveToday = Math.max(0, amountRunToday - dailyTarget);
      incentiveType = "full_extra";
    }
  } 
  // Tier 2: If daily amount exceeds tier2Min
  else if (amountRunToday > config.incentiveTier2Min) {
    // Tier 2: Percentage of total amount
    incentiveToday = Math.round((amountRunToday * config.incentiveTier2Percent) / 100);
    incentiveType = "percentage";
  }

  const remainingToAchieve = Math.max(0, dailyTarget - amountRunToday);

  return {
    driverId,
    date: targetDate.toISOString().split("T")[0],
    dailyTargetAmount: dailyTarget,
    amountRunToday,
    tripsCountToday,
    incentiveToday,
    incentiveType,
    remainingToAchieve,
  };
}

/**
 * Get monthly earnings stats for a driver
 */
export async function getDriverMonthlyStats(
  driverId: string,
  year: number,
  month: number
) {
  // Validate driver exists
  const driver = await getDriverById(driverId);
  if (!driver) {
    const err: any = new Error("Driver not found");
    err.statusCode = 404;
    throw err;
  }

  // Validate month (1-12)
  if (month < 1 || month > 12) {
    const err: any = new Error("Invalid month. Must be between 1 and 12");
    err.statusCode = 400;
    throw err;
  }

  // Calculate date range for the month
  const startOfMonth = new Date(year, month - 1, 1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  // Get completed trips for the month
  const trips = await prisma.trip.findMany({
    where: {
      driverId,
      status: {
        in: [TripStatus.TRIP_ENDED, TripStatus.COMPLETED, TripStatus.PAYMENT_DONE],
      },
      paymentStatus: PaymentStatus.COMPLETED,
      endedAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: {
      finalAmount: true,
      totalAmount: true,
    },
  });

  // Calculate monthly stats
  const monthlyEarnings = trips.reduce((sum, trip) => sum + (trip.finalAmount || trip.totalAmount || 0), 0);
  const tripsCount = trips.length;

  // Get earnings config
  const config = await getEarningsConfig();

  // Calculate monthly bonus
  let monthlyBonus = 0;
  let bonusTier = null;
  const bonusTiers = (config.monthlyBonusTiers as any[]) || [];
  
  if (bonusTiers.length > 0) {
    // Sort by minEarnings descending to find highest applicable tier
    const sortedTiers = [...bonusTiers].sort((a, b) => b.minEarnings - a.minEarnings);
    for (const tier of sortedTiers) {
      if (monthlyEarnings >= tier.minEarnings) {
        monthlyBonus = tier.bonus || 0;
        bonusTier = tier;
        break;
      }
    }
  }

  // Calculate monthly deduction policy cut
  let monthlyDeductionPolicyCut = 0;
  let deductionTier = null;
  const deductionTiers = (config.monthlyDeductionTiers as any[]) || [];
  
  if (deductionTiers.length > 0) {
    // Sort by maxEarnings ascending to find lowest applicable tier
    const sortedTiers = [...deductionTiers].sort((a, b) => a.maxEarnings - b.maxEarnings);
    for (const tier of sortedTiers) {
      if (monthlyEarnings <= tier.maxEarnings) {
        monthlyDeductionPolicyCut = Math.round((monthlyEarnings * tier.cutPercent) / 100);
        deductionTier = tier;
        break;
      }
    }
  }

  return {
    driverId,
    year,
    month,
    monthlyEarnings,
    tripsCount,
    monthlyBonus,
    bonusTier,
    monthlyDeductionPolicyCut,
    deductionTier,
  };
}

/**
 * Get complete settlement for a driver (earnings + bonuses - penalties - policy cut)
 */
export async function getDriverSettlement(
  driverId: string,
  year: number,
  month: number
) {
  // Get monthly stats
  const monthlyStats = await getDriverMonthlyStats(driverId, year, month);

  // Get penalties for the month
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const { data: penalties } = await getDriverPenaltiesPaginated(0, 1000, {
    driverId,
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  // Calculate total penalties
  const totalPenalties = penalties.reduce((sum, penalty) => sum + (penalty.amount || 0), 0);

  // Calculate net earnings
  const netEarnings =
    monthlyStats.monthlyEarnings +
    monthlyStats.monthlyBonus -
    totalPenalties -
    monthlyStats.monthlyDeductionPolicyCut;

  return {
    ...monthlyStats,
    totalPenalties,
    penaltiesCount: penalties.length,
    penalties: penalties.map((p) => ({
      id: p.id,
      penaltyName: p.Penalty?.name,
      amount: p.amount,
      violationDate: p.violationDate,
      description: p.description,
    })),
    netEarnings,
    breakdown: {
      grossEarnings: monthlyStats.monthlyEarnings,
      bonus: monthlyStats.monthlyBonus,
      penalties: -totalPenalties,
      policyCut: -monthlyStats.monthlyDeductionPolicyCut,
      net: netEarnings,
    },
  };
}
