// src/services/attendanceAggregation.service.ts

import prisma from "../config/prismaClient";
import logger from "../config/logger";
import { ATTENDANCE_AGGREGATION_CONFIG } from "../constants/attendance";
import { AttendanceStatus } from "@prisma/client";

/**
 * Background service that aggregates daily driver attendance.
 * 
 * LOGIC:
 * - Queries AttendanceSession for each driver/day
 * - Calculates total online minutes from clock-in/clock-out times
 * - Counts completed trips for the day
 * - Derives status: PRESENT (>=240min or trips>0), PARTIAL (30-239min), ABSENT (no activity)
 * 
 * FEATURES:
 * - Idempotent: safe to rerun for same day
 * - Persistent: stores results in Attendance table
 * - Incremental: processes recent days only
 */
class AttendanceAggregationService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private intervalActive = false;

  /**
   * Start the background aggregation worker
   */
  public start(): void {
    if (this.intervalActive) {
      logger.warn("Attendance aggregation service already running");
      return;
    }

    logger.info("Starting attendance aggregation service", {
      intervalMs: ATTENDANCE_AGGREGATION_CONFIG.AGGREGATION_INTERVAL_MS,
      lookbackDays: ATTENDANCE_AGGREGATION_CONFIG.LOOKBACK_DAYS,
    });

    // Run immediately on startup
    this.runAggregation().catch((err) => {
      logger.error("Initial attendance aggregation failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    });

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.runAggregation().catch((err) => {
        logger.error("Scheduled attendance aggregation failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }, ATTENDANCE_AGGREGATION_CONFIG.AGGREGATION_INTERVAL_MS);

    this.intervalActive = true;
  }

  /**
   * Stop the background worker
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.intervalActive = false;
      logger.info("Attendance aggregation service stopped");
    }
  }

  /**
   * Get service status
   */
  public getStatus(): { isRunning: boolean; intervalActive: boolean } {
    return {
      isRunning: this.isRunning,
      intervalActive: this.intervalActive,
    };
  }

  /**
   * Main aggregation logic - processes recent days for all active drivers
   */
  private async runAggregation(): Promise<void> {
    if (this.isRunning) {
      logger.debug("Attendance aggregation already in progress, skipping");
      return;
    }

    this.isRunning = true;

    try {
      const startTime = Date.now();
      logger.info("Starting attendance aggregation");

      // Calculate date range to process
      const endDate = new Date();
      endDate.setHours(0, 0, 0, 0); // Start of today

      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - ATTENDANCE_AGGREGATION_CONFIG.LOOKBACK_DAYS);

      logger.debug("Processing attendance for date range", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Get all active drivers
      const drivers = await prisma.driver.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      if (drivers.length === 0) {
        logger.debug("No active drivers found, skipping aggregation");
        return;
      }

      logger.debug("Processing attendance for drivers", {
        driverCount: drivers.length,
      });

      let processedCount = 0;
      let updatedCount = 0;

      // Process each driver
      for (const driver of drivers) {
        try {
          // Process each day in the range
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const dayStart = new Date(currentDate);
            const dayEnd = new Date(currentDate);
            dayEnd.setHours(23, 59, 59, 999);

            await this.aggregateDriverDay(driver.id, dayStart, dayEnd);
            processedCount++;

            currentDate.setDate(currentDate.getDate() + 1);
          }

          updatedCount++;
        } catch (err) {
          logger.error("Failed to aggregate attendance for driver", {
            driverId: driver.id,
            driverName: `${driver.firstName} ${driver.lastName}`,
            error: err instanceof Error ? err.message : String(err),
          });
          // Continue processing other drivers
        }
      }

      const duration = Date.now() - startTime;
      logger.info("Attendance aggregation completed", {
        driversProcessed: updatedCount,
        daysProcessed: processedCount,
        durationMs: duration,
      });
    } catch (err) {
      logger.error("Attendance aggregation failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Aggregate attendance for a single driver on a single day
   */
  private async aggregateDriverDay(
    driverId: string,
    dayStart: Date,
    dayEnd: Date
  ): Promise<void> {
    const dateOnly = new Date(dayStart);
    dateOnly.setHours(0, 0, 0, 0);

    // Step 1: Get all attendance sessions for this driver on this day
    const attendance = await prisma.attendance.findUnique({
      where: {
        driverId_date: {
          driverId,
          date: dateOnly,
        },
      },
      include: {
        sessions: {
          orderBy: {
            clockIn: "asc",
          },
        },
      },
    });

    // Step 2: Calculate total online minutes from sessions
    let totalOnlineMinutes = 0;
    let firstOnlineAt: Date | null = null;
    let lastOfflineAt: Date | null = null;

    if (attendance?.sessions && attendance.sessions.length > 0) {
      firstOnlineAt = attendance.sessions[0].clockIn;

      for (const session of attendance.sessions) {
        const clockIn = session.clockIn;
        const clockOut = session.clockOut || dayEnd; // If still open, use end of day

        const sessionMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000);
        totalOnlineMinutes += Math.max(0, sessionMinutes);

        // Track last clock-out
        if (session.clockOut && (!lastOfflineAt || session.clockOut > lastOfflineAt)) {
          lastOfflineAt = session.clockOut;
        }
      }

      // If no clock-out recorded but last session exists, use dayEnd
      if (!lastOfflineAt && attendance.sessions.length > 0) {
        lastOfflineAt = dayEnd;
      }
    }

    // Step 3: Count completed trips for this driver on this day
    const tripsCompleted = await prisma.trip.count({
      where: {
        driverId,
        status: "COMPLETED",
        endedAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    // Step 4: Derive attendance status
    const status = this.deriveAttendanceStatus(totalOnlineMinutes, tripsCompleted);

    // Step 5: Upsert attendance record
    await prisma.attendance.upsert({
      where: {
        driverId_date: {
          driverId,
          date: dateOnly,
        },
      },
      create: {
        driverId,
        date: dateOnly,
        status,
        firstOnlineAt,
        lastOfflineAt,
        totalOnlineMinutes,
        tripsCompleted,
      },
      update: {
        status,
        firstOnlineAt,
        lastOfflineAt,
        totalOnlineMinutes,
        tripsCompleted,
        updatedAt: new Date(),
      },
    });

    logger.debug("Aggregated attendance for driver/day", {
      driverId,
      date: dateOnly.toISOString().split("T")[0],
      totalOnlineMinutes,
      tripsCompleted,
      status,
    });
  }

  /**
   * Derive attendance status based on online minutes and trip count
   */
  private deriveAttendanceStatus(
    totalOnlineMinutes: number,
    tripsCompleted: number
  ): AttendanceStatus {
    const { MIN_PRESENT_MINUTES, MIN_PARTIAL_MINUTES } = ATTENDANCE_AGGREGATION_CONFIG;

    // Rule 1: If driver completed at least 1 trip, mark as PRESENT
    if (tripsCompleted > 0) {
      return "PRESENT";
    }

    // Rule 2: If online >= MIN_PRESENT_MINUTES, mark as PRESENT
    if (totalOnlineMinutes >= MIN_PRESENT_MINUTES) {
      return "PRESENT";
    }

    // Rule 3: If online >= MIN_PARTIAL_MINUTES but < MIN_PRESENT_MINUTES, mark as PARTIAL
    if (totalOnlineMinutes >= MIN_PARTIAL_MINUTES) {
      return "PARTIAL";
    }

    // Rule 4: Otherwise, mark as ABSENT
    return "ABSENT";
  }

  /**
   * Manually trigger aggregation for a specific date range (for admin use)
   */
  public async aggregateDateRange(startDate: Date, endDate: Date): Promise<void> {
    logger.info("Manual attendance aggregation triggered", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const drivers = await prisma.driver.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const driver of drivers) {
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        await this.aggregateDriverDay(driver.id, dayStart, dayEnd);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    logger.info("Manual attendance aggregation completed");
  }
}

// Export singleton instance
export const attendanceAggregationService = new AttendanceAggregationService();
