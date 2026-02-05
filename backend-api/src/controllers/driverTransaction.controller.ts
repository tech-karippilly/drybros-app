// src/controllers/driverTransaction.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  createTransaction,
  getTransactions,
  getTransaction,
  getDriverTransactions,
  getDriverSummary,
  getTripTransactions,
  CreateTransactionDTO,
  GetTransactionsQueryDTO,
  GetDriverSummaryQueryDTO,
} from "../services/driverTransaction.service";
import { BadRequestError } from "../utils/errors";

/**
 * Create a new driver transaction
 * POST /api/driver-transactions
 */
export async function createDriverTransaction(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data: CreateTransactionDTO = req.body;

    // Validate required fields
    if (!data.driverId) {
      throw new BadRequestError("Driver ID is required");
    }
    if (!data.amount) {
      throw new BadRequestError("Amount is required");
    }
    if (!data.transactionType) {
      throw new BadRequestError("Transaction type is required");
    }
    if (!data.type) {
      throw new BadRequestError("Type is required");
    }

    // Validate enum values
    if (!["CREDIT", "DEBIT"].includes(data.transactionType)) {
      throw new BadRequestError("Transaction type must be CREDIT or DEBIT");
    }
    if (!["PENALTY", "TRIP"].includes(data.type)) {
      throw new BadRequestError("Type must be PENALTY or TRIP");
    }

    const transaction = await createTransaction(data);
    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get paginated driver transactions with filters
 * GET /api/driver-transactions
 */
export async function getDriverTransactionsList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const query: GetTransactionsQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      driverId: req.query.driverId as string,
      transactionType: req.query.transactionType as "CREDIT" | "DEBIT",
      type: req.query.type as "PENALTY" | "TRIP",
      tripId: req.query.tripId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    // Validate enum values if provided
    if (query.transactionType && !["CREDIT", "DEBIT"].includes(query.transactionType)) {
      throw new BadRequestError("Transaction type must be CREDIT or DEBIT");
    }
    if (query.type && !["PENALTY", "TRIP"].includes(query.type)) {
      throw new BadRequestError("Type must be PENALTY or TRIP");
    }

    const result = await getTransactions(query);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single transaction by ID
 * GET /api/driver-transactions/:id
 */
export async function getDriverTransactionById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const transaction = await getTransaction(id);
    res.json({
      success: true,
      data: transaction,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all transactions for a specific driver
 * GET /api/driver-transactions/driver/:driverId
 */
export async function getTransactionsByDriver(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.params.driverId as string;
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const transactions = await getDriverTransactions(driverId, page, limit);
    res.json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get driver transaction summary
 * GET /api/driver-transactions/driver/:driverId/summary
 */
export async function getDriverTransactionSummary(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.params.driverId as string;
    const query: GetDriverSummaryQueryDTO = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const summary = await getDriverSummary(driverId, query);
    res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get transactions for a specific trip
 * GET /api/driver-transactions/trip/:tripId
 */
export async function getTransactionsByTrip(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = req.params.tripId as string;
    const transactions = await getTripTransactions(tripId);
    res.json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
}
