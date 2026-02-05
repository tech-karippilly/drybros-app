// src/services/driverTransaction.service.ts
import {
  createDriverTransaction,
  getDriverTransactionsPaginated,
  getDriverTransactionById,
  getDriverTransactionsByDriverId,
  getDriverTransactionSummary,
  getDriverTransactionsByTripId,
  CreateDriverTransactionInput,
  GetDriverTransactionsFilters,
} from "../repositories/driverTransaction.repository";
import { TransactionType, DriverTransactionType } from "@prisma/client";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { getDriverById } from "../repositories/driver.repository";
import { getTripById } from "../repositories/trip.repository";
import logger from "../config/logger";

export interface CreateTransactionDTO {
  driverId: string;
  amount: number;
  transactionType: "CREDIT" | "DEBIT";
  tripId?: string;
  type: "PENALTY" | "TRIP";
  description?: string;
}

export interface GetTransactionsQueryDTO {
  page?: number;
  limit?: number;
  driverId?: string;
  transactionType?: "CREDIT" | "DEBIT";
  type?: "PENALTY" | "TRIP";
  tripId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetDriverSummaryQueryDTO {
  startDate?: string;
  endDate?: string;
}

/**
 * Create a new driver transaction
 */
export async function createTransaction(data: CreateTransactionDTO) {
  // Validate driver exists
  const driver = await getDriverById(data.driverId);
  if (!driver) {
    throw new NotFoundError("Driver not found");
  }

  // Validate trip if provided
  if (data.tripId) {
    const trip = await getTripById(data.tripId);
    if (!trip) {
      throw new NotFoundError("Trip not found");
    }

    // Validate trip belongs to the driver
    if (trip.driverId !== data.driverId) {
      throw new BadRequestError("Trip does not belong to this driver");
    }
  }

  // Validate amount is positive
  if (data.amount <= 0) {
    throw new BadRequestError("Amount must be greater than 0");
  }

  // Validate type and tripId consistency
  if (data.type === "TRIP" && !data.tripId) {
    throw new BadRequestError("Trip ID is required for TRIP type transactions");
  }

  const input: CreateDriverTransactionInput = {
    driverId: data.driverId,
    amount: data.amount,
    transactionType: TransactionType[data.transactionType],
    tripId: data.tripId,
    type: DriverTransactionType[data.type],
    description: data.description,
  };

  const transaction = await createDriverTransaction(input);

  logger.info("Driver transaction created", {
    transactionId: transaction.id,
    driverId: data.driverId,
    amount: data.amount,
    type: data.type,
    transactionType: data.transactionType,
  });

  return transaction;
}

/**
 * Get paginated driver transactions with filters
 */
export async function getTransactions(query: GetTransactionsQueryDTO) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const filters: GetDriverTransactionsFilters = {};

  if (query.driverId) {
    filters.driverId = query.driverId;
  }

  if (query.transactionType) {
    filters.transactionType = TransactionType[query.transactionType];
  }

  if (query.type) {
    filters.type = DriverTransactionType[query.type];
  }

  if (query.tripId) {
    filters.tripId = query.tripId;
  }

  if (query.startDate) {
    filters.startDate = new Date(query.startDate);
  }

  if (query.endDate) {
    filters.endDate = new Date(query.endDate);
  }

  const { data, total } = await getDriverTransactionsPaginated(skip, limit, filters);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single transaction by ID
 */
export async function getTransaction(id: string) {
  const transaction = await getDriverTransactionById(id);
  if (!transaction) {
    throw new NotFoundError("Transaction not found");
  }
  return transaction;
}

/**
 * Get all transactions for a specific driver
 */
export async function getDriverTransactions(driverId: string, page?: number, limit?: number) {
  // Validate driver exists
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError("Driver not found");
  }

  const skip = page && limit ? (page - 1) * limit : undefined;
  const take = limit;

  const transactions = await getDriverTransactionsByDriverId(driverId, skip, take);
  return transactions;
}

/**
 * Get driver transaction summary
 */
export async function getDriverSummary(driverId: string, query: GetDriverSummaryQueryDTO) {
  // Validate driver exists
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError("Driver not found");
  }

  const startDate = query.startDate ? new Date(query.startDate) : undefined;
  const endDate = query.endDate ? new Date(query.endDate) : undefined;

  const summary = await getDriverTransactionSummary(driverId, startDate, endDate);
  return summary;
}

/**
 * Get transactions for a specific trip
 */
export async function getTripTransactions(tripId: string) {
  const trip = await getTripById(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  const transactions = await getDriverTransactionsByTripId(tripId);
  return transactions;
}

/**
 * Create a trip earning transaction (called when trip ends)
 */
export async function createTripEarningTransaction(
  driverId: string,
  tripId: string,
  amount: number,
  description?: string
) {
  return createTransaction({
    driverId,
    amount,
    transactionType: "CREDIT",
    tripId,
    type: "TRIP",
    description: description || "Trip earning",
  });
}

/**
 * Create a penalty transaction
 */
export async function createPenaltyTransaction(
  driverId: string,
  amount: number,
  description?: string
) {
  return createTransaction({
    driverId,
    amount,
    transactionType: "DEBIT",
    type: "PENALTY",
    description: description || "Penalty deduction",
  });
}
