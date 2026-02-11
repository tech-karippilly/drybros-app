import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../config/prismaClient';
import penaltyRepository from '../repositories/penalty.repository';
import { createDriverTransaction } from '../repositories/driverTransaction.repository';
import { ApplyDeductionDTO, PenaltyNotificationData } from '../types/penalty.types';
import logger from '../config/logger';
import { sendPenaltyNotificationEmail } from './email.service';

export class DeductionService {
  /**
   * Apply a manual deduction to a driver
   */
  async applyDeduction(data: ApplyDeductionDTO) {
    const { penaltyId, driverId, amount, reason, tripId, appliedBy } = data;

    // Get penalty details
    const penalty = await penaltyRepository.findById(penaltyId);
    if (!penalty) {
      throw new Error(`Penalty not found with ID: ${penaltyId}`);
    }

    if (!penalty.isActive) {
      throw new Error(`Penalty "${penalty.name}" is not active`);
    }

    // Get driver details
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        Franchise: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!driver) {
      throw new Error(`Driver not found with ID: ${driverId}`);
    }

    // Determine deduction amount (use override or default)
    const deductionAmount = amount || penalty.amount;
    
    // Get current incentive before deduction
    const currentIncentive = driver.incentive ? parseFloat(driver.incentive.toString()) : 0;
    const newIncentive = currentIncentive - deductionAmount;

    // Create driver transaction
    const transaction = await createDriverTransaction({
      driverId,
      amount: new Decimal(-deductionAmount),
      transactionType: 'DEBIT',
      type: 'PENALTY',
      description: reason || penalty.description || `Penalty: ${penalty.name}`,
      tripId,
      penaltyId: penalty.id,
      appliedBy,
      metadata: {
        penaltyName: penalty.name,
        penaltyCategory: penalty.category,
        penaltySeverity: penalty.severity,
        previousIncentive: currentIncentive,
        newIncentive,
        timestamp: new Date().toISOString(),
      },
    });

    // Update driver incentive
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        incentive: new Decimal(newIncentive),
      },
    });

    logger.info(
      `Deduction applied: Driver ${driver.driverCode}, Penalty ${penalty.name}, Amount ₹${deductionAmount}, New Incentive: ₹${newIncentive}`
    );

    // Send notifications if configured
    if (penalty.notifyAdmin || penalty.notifyManager || penalty.notifyDriver) {
      await this.sendNotifications(penalty, driver, deductionAmount, reason, appliedBy);
    }

    // Block driver if configured
    if (penalty.blockDriver && driver.status !== 'BLOCKED') {
      await this.blockDriver(driverId, `Automatic block due to: ${penalty.name}`, appliedBy);
    }

    return {
      transaction,
      previousIncentive: currentIncentive,
      newIncentive,
    };
  }

  /**
   * Block a driver
   */
  async blockDriver(driverId: string, reason: string, blockedBy: string) {
    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        status: 'BLOCKED',
      },
      include: {
        Franchise: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.warn(`Driver blocked: ${driver.driverCode} - Reason: ${reason}`);

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'DRIVER_STATUS_CHANGED',
        entityType: 'DRIVER',
        entityId: driverId,
        driverId,
        userId: blockedBy,
        description: `Driver blocked: ${reason}`,
        metadata: {
          previousStatus: 'ACTIVE',
          newStatus: 'BLOCKED',
          reason,
        },
      },
    });

    return driver;
  }

  /**
   * Unblock a driver
   */
  async unblockDriver(driverId: string, reason: string, unblockedBy: string) {
    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        status: 'ACTIVE',
      },
    });

    logger.info(`Driver unblocked: ${driver.driverCode} - Reason: ${reason}`);

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'DRIVER_STATUS_CHANGED',
        entityType: 'DRIVER',
        entityId: driverId,
        driverId,
        userId: unblockedBy,
        description: `Driver unblocked: ${reason}`,
        metadata: {
          previousStatus: 'BLOCKED',
          newStatus: 'ACTIVE',
          reason,
        },
      },
    });

    return driver;
  }

  /**
   * Send penalty notifications
   */
  private async sendNotifications(
    penalty: any,
    driver: any,
    amount: number,
    reason?: string,
    appliedBy?: string
  ) {
    try {
      // Get admin and manager emails
      const admins = await prisma.user.findMany({
        where: {
          role: 'ADMIN',
          isActive: true,
        },
        select: { email: true, fullName: true },
      });

      const managers = await prisma.user.findMany({
        where: {
          role: 'MANAGER',
          franchiseId: driver.franchiseId,
          isActive: true,
        },
        select: { email: true, fullName: true },
      });

      const appliedByUser = appliedBy
        ? await prisma.user.findUnique({
            where: { id: appliedBy },
            select: { id: true, fullName: true, email: true },
          })
        : undefined;

      const notificationData: PenaltyNotificationData = {
        penalty,
        driver: {
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          driverCode: driver.driverCode,
          phone: driver.phone,
          email: driver.email,
          franchiseId: driver.franchiseId,
        },
        amount,
        reason,
        timestamp: new Date(),
        appliedBy: appliedByUser || undefined,
      };

      // Send to admins
      if (penalty.notifyAdmin && admins.length > 0) {
        for (const admin of admins) {
          await sendPenaltyNotificationEmail(admin.email, notificationData);
        }
      }

      // Send to managers
      if (penalty.notifyManager && managers.length > 0) {
        for (const manager of managers) {
          await sendPenaltyNotificationEmail(manager.email, notificationData);
        }
      }

      // Send to driver
      if (penalty.notifyDriver && driver.email) {
        await sendPenaltyNotificationEmail(driver.email, notificationData);
      }
    } catch (error) {
      logger.error(`Error sending penalty notifications: ${error}`);
      // Don't throw error - notification failure shouldn't block the deduction
    }
  }

  /**
   * Get driver's penalty history
   */
  async getDriverPenaltyHistory(driverId: string, startDate?: Date, endDate?: Date) {
    return await prisma.driverTransaction.findMany({
      where: {
        driverId,
        type: 'PENALTY',
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      include: {
        Penalty: true,
        AppliedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        Trip: {
          select: {
            id: true,
            customerName: true,
            pickupLocation: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export default new DeductionService();
