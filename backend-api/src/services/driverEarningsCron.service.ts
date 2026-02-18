// src/services/driverEarningsCron.service.ts
import cron from "node-cron";
import prisma from "../config/prismaClient";
import { TripStatus, PaymentStatus } from "@prisma/client";
import { getDriverEarningsConfigByFranchise } from "../repositories/earningsConfig.repository";
import logger from "../config/logger";

/**
 * Record daily earnings for all active drivers
 * This should run every day at 12:00 AM (midnight)
 */
export async function recordDailyEarnings() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const dateStr = yesterday.toISOString().split("T")[0];

  logger.info(`[CRON] Starting daily earnings recording for ${dateStr}`);

  try {
    // Get all active drivers
    const drivers = await prisma.driver.findMany({
      where: { isActive: true },
      select: {
        id: true,
        franchiseId: true,
        dailyTargetAmount: true,
      },
    });

    let processedCount = 0;
    let errorCount = 0;

    for (const driver of drivers) {
      try {
        // Get franchise config for daily target
        const franchiseConfig = await getDriverEarningsConfigByFranchise(driver.franchiseId);
        const dailyTarget = franchiseConfig?.dailyTargetDefault || driver.dailyTargetAmount || 1250;

        // Get completed trips for yesterday
        const trips = await prisma.trip.findMany({
          where: {
            driverId: driver.id,
            status: {
              in: [TripStatus.TRIP_ENDED, TripStatus.COMPLETED, TripStatus.PAYMENT_DONE],
            },
            paymentStatus: PaymentStatus.COMPLETED,
            endedAt: {
              gte: yesterday,
              lte: endOfYesterday,
            },
          },
          select: {
            finalAmount: true,
            totalAmount: true,
          },
        });

        // Calculate total earnings
        const totalEarnings = trips.reduce(
          (sum, trip) => sum + (trip.finalAmount || trip.totalAmount || 0),
          0
        );

        // Calculate incentive based on config
        let incentiveEarned = 0;
        if (franchiseConfig) {
          const tier1Min = franchiseConfig.incentiveTier1Min || 1250;
          const tier1Max = franchiseConfig.incentiveTier1Max || 1550;
          const tier2Min = franchiseConfig.incentiveTier2Min || 1550;
          const tier2Percent = franchiseConfig.incentiveTier2Percent || 20;

          if (totalEarnings >= tier1Min && totalEarnings <= tier1Max) {
            if (franchiseConfig.incentiveTier1Type === "full_extra") {
              incentiveEarned = Math.max(0, totalEarnings - dailyTarget);
            }
          } else if (totalEarnings > tier2Min) {
            incentiveEarned = Math.round((totalEarnings * tier2Percent) / 100);
          }
        }

        // Upsert daily metrics
        await prisma.driverDailyMetrics.upsert({
          where: {
            driverId_date: {
              driverId: driver.id,
              date: yesterday,
            },
          },
          update: {
            numberOfTrips: trips.length,
            dailyLimit: dailyTarget,
            incentive: incentiveEarned,
          },
          create: {
            driverId: driver.id,
            date: yesterday,
            numberOfTrips: trips.length,
            dailyLimit: dailyTarget,
            incentive: incentiveEarned,
            cashInHand: 0,
          },
        });

        // Update driver's dailyTargetAmount for the new day
        await prisma.driver.update({
          where: { id: driver.id },
          data: {
            dailyTargetAmount: dailyTarget,
            remainingDailyLimit: dailyTarget,
          },
        });

        processedCount++;
      } catch (error) {
        errorCount++;
        logger.error(`[CRON] Error recording daily earnings for driver ${driver.id}:`, error);
      }
    }

    logger.info(`[CRON] Daily earnings recording completed. Processed: ${processedCount}, Errors: ${errorCount}`);
    return {
      success: true,
      date: dateStr,
      processedCount,
      errorCount,
    };
  } catch (error) {
    logger.error("[CRON] Fatal error in daily earnings recording:", error);
    throw error;
  }
}

/**
 * Record monthly earnings for all active drivers
 * This should run at the end of every month at 12:00 PM (noon)
 */
export async function recordMonthlyEarnings() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (0 = January)
  
  // Get previous month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  const startOfMonth = new Date(prevYear, prevMonth, 1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const endOfMonth = new Date(prevYear, prevMonth + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  logger.info(`[CRON] Starting monthly earnings recording for ${prevYear}-${prevMonth + 1}`);

  try {
    // Get all active drivers
    const drivers = await prisma.driver.findMany({
      where: { isActive: true },
      select: {
        id: true,
        franchiseId: true,
      },
    });

    let processedCount = 0;
    let errorCount = 0;

    for (const driver of drivers) {
      try {
        // Get franchise config
        const franchiseConfig = await getDriverEarningsConfigByFranchise(driver.franchiseId);

        // Get completed trips for the month
        const trips = await prisma.trip.findMany({
          where: {
            driverId: driver.id,
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

        // Calculate total earnings
        const totalEarnings = trips.reduce(
          (sum, trip) => sum + (trip.finalAmount || trip.totalAmount || 0),
          0
        );

        // Calculate monthly bonus
        let bonusEarned = 0;
        if (franchiseConfig?.monthlyBonusTiers) {
          const bonusTiers = franchiseConfig.monthlyBonusTiers as any[];
          const sortedTiers = [...bonusTiers].sort((a, b) => b.minEarnings - a.minEarnings);
          for (const tier of sortedTiers) {
            if (totalEarnings >= tier.minEarnings) {
              bonusEarned = tier.bonus || 0;
              break;
            }
          }
        }

        // Calculate total incentive from daily metrics
        const dailyMetrics = await prisma.driverDailyMetrics.aggregate({
          where: {
            driverId: driver.id,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            incentive: true,
          },
        });
        const totalIncentive = Number(dailyMetrics._sum.incentive || 0);

        // Get penalties for the month from DriverTransaction
        const penalties = await prisma.driverTransaction.findMany({
          where: {
            driverId: driver.id,
            type: "PENALTY",
            transactionType: "DEBIT",
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select: {
            amount: true,
          },
        });
        const totalPenalties = penalties.reduce((sum, p) => sum + Number(p.amount || 0), 0);

        // Calculate monthly deduction policy cut
        let monthlyDeduction = 0;
        if (franchiseConfig?.monthlyDeductionTiers) {
          const deductionTiers = franchiseConfig.monthlyDeductionTiers as any[];
          const sortedTiers = [...deductionTiers].sort((a, b) => a.maxEarnings - b.maxEarnings);
          for (const tier of sortedTiers) {
            if (totalEarnings <= tier.maxEarnings) {
              monthlyDeduction = Math.round((totalEarnings * tier.cutPercent) / 100);
              break;
            }
          }
        }

        // Update or create monthly performance record
        await prisma.driverMonthlyPerformance.upsert({
          where: {
            driverId_month_year: {
              driverId: driver.id,
              month: prevMonth + 1, // Store as 1-indexed
              year: prevYear,
            },
          },
          update: {
            totalTrips: trips.length,
            totalEarnings,
            totalIncentive,
            totalPenalty: totalPenalties,
            monthlyDeduction,
          },
          create: {
            driverId: driver.id,
            franchiseId: driver.franchiseId,
            month: prevMonth + 1, // Store as 1-indexed
            year: prevYear,
            totalTrips: trips.length,
            totalEarnings,
            totalIncentive,
            totalPenalty: totalPenalties,
            monthlyDeduction,
          },
        });

        // Update driver's bonus
        await prisma.driver.update({
          where: { id: driver.id },
          data: {
            bonus: bonusEarned,
          },
        });

        processedCount++;
      } catch (error) {
        errorCount++;
        logger.error(`[CRON] Error recording monthly earnings for driver ${driver.id}:`, error);
      }
    }

    logger.info(`[CRON] Monthly earnings recording completed. Processed: ${processedCount}, Errors: ${errorCount}`);
    return {
      success: true,
      year: prevYear,
      month: prevMonth + 1,
      processedCount,
      errorCount,
    };
  } catch (error) {
    logger.error("[CRON] Fatal error in monthly earnings recording:", error);
    throw error;
  }
}

/**
 * Initialize cron jobs for driver earnings
 */
export function initializeEarningsCronJobs() {
  // Daily earnings recording - Run at 12:00 AM every day
  // Cron format: minute hour day month day-of-week
  cron.schedule("0 0 * * *", async () => {
    logger.info("[CRON] Starting scheduled daily earnings recording job");
    try {
      await recordDailyEarnings();
    } catch (error) {
      logger.error("[CRON] Daily earnings cron job failed:", error);
    }
  });

  // Monthly earnings recording - Run at 12:00 PM on the 1st of every month
  cron.schedule("0 12 1 * *", async () => {
    logger.info("[CRON] Starting scheduled monthly earnings recording job");
    try {
      await recordMonthlyEarnings();
    } catch (error) {
      logger.error("[CRON] Monthly earnings cron job failed:", error);
    }
  });

  logger.info("[CRON] Earnings cron jobs initialized successfully");
}
