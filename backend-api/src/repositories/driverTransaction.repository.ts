// src/repositories/driverTransaction.repository.ts
import prisma from "../config/prismaClient";
import { TransactionType, DriverTransactionType, Prisma } from "@prisma/client";

export interface CreateDriverTransactionInput {
  driverId: string;
  amount: number;
  transactionType: TransactionType;
  tripId?: string;
  type: DriverTransactionType;
  description?: string;
}

export interface GetDriverTransactionsFilters {
  driverId?: string;
  transactionType?: TransactionType;
  type?: DriverTransactionType;
  tripId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Create a new driver transaction
 */
export async function createDriverTransaction(data: CreateDriverTransactionInput) {
  return prisma.driverTransaction.create({
    data: {
      driverId: data.driverId,
      amount: data.amount,
      transactionType: data.transactionType,
      tripId: data.tripId,
      type: data.type,
      description: data.description,
    },
    include: {
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          driverCode: true,
        },
      },
      Trip: {
        select: {
          id: true,
          customerName: true,
          pickupLocation: true,
          dropLocation: true,
          totalAmount: true,
        },
      },
    },
  });
}

/**
 * Get all driver transactions with filters and pagination
 */
export async function getDriverTransactionsPaginated(
  skip: number,
  take: number,
  filters?: GetDriverTransactionsFilters
) {
  const where: Prisma.DriverTransactionWhereInput = {};

  if (filters?.driverId) {
    where.driverId = filters.driverId;
  }

  if (filters?.transactionType) {
    where.transactionType = filters.transactionType;
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.tripId) {
    where.tripId = filters.tripId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const [data, total] = await Promise.all([
    prisma.driverTransaction.findMany({
      skip,
      take,
      where,
      include: {
        Driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            driverCode: true,
          },
        },
        Trip: {
          select: {
            id: true,
            customerName: true,
            pickupLocation: true,
            dropLocation: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.driverTransaction.count({ where }),
  ]);

  return { data, total };
}

/**
 * Get a single driver transaction by ID
 */
export async function getDriverTransactionById(id: string) {
  return prisma.driverTransaction.findUnique({
    where: { id },
    include: {
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          driverCode: true,
        },
      },
      Trip: {
        select: {
          id: true,
          customerName: true,
          pickupLocation: true,
          dropLocation: true,
          totalAmount: true,
        },
      },
    },
  });
}

/**
 * Get all transactions for a specific driver
 */
export async function getDriverTransactionsByDriverId(
  driverId: string,
  skip?: number,
  take?: number
) {
  const query: Prisma.DriverTransactionFindManyArgs = {
    where: { driverId },
    include: {
      Trip: {
        select: {
          id: true,
          customerName: true,
          pickupLocation: true,
          dropLocation: true,
          totalAmount: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  };

  if (skip !== undefined) query.skip = skip;
  if (take !== undefined) query.take = take;

  return prisma.driverTransaction.findMany(query);
}

/**
 * Get driver transaction summary (total credits, debits, balance)
 */
export async function getDriverTransactionSummary(
  driverId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: Prisma.DriverTransactionWhereInput = { driverId };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [credits, debits] = await Promise.all([
    prisma.driverTransaction.aggregate({
      where: { ...where, transactionType: TransactionType.CREDIT },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.driverTransaction.aggregate({
      where: { ...where, transactionType: TransactionType.DEBIT },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalCredits = Number(credits._sum.amount || 0);
  const totalDebits = Number(debits._sum.amount || 0);
  const balance = totalCredits - totalDebits;

  return {
    driverId,
    totalCredits,
    totalDebits,
    balance,
    creditCount: credits._count,
    debitCount: debits._count,
    startDate,
    endDate,
  };
}

/**
 * Get transactions by trip ID
 */
export async function getDriverTransactionsByTripId(tripId: string) {
  return prisma.driverTransaction.findMany({
    where: { tripId },
    include: {
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          driverCode: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
