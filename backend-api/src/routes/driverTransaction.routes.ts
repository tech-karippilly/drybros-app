// src/routes/driverTransaction.routes.ts
import express from "express";
import {
  createDriverTransaction,
  getDriverTransactionsList,
  getDriverTransactionById,
  getTransactionsByDriver,
  getDriverTransactionSummary,
  getTransactionsByTrip,
} from "../controllers/driverTransaction.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";
import { validate, validateQuery } from "../middlewares/validation";
import { z } from "zod";

const router = express.Router();

// All driver transaction routes require authentication
router.use(authMiddleware);

// All routes accessible by ADMIN, MANAGER, STAFF
const allowedRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICE_STAFF];

// Driver-specific routes (must come before admin routes to avoid conflicts)
/**
 * @swagger
 * /api/driver-transactions/me:
 *   get:
 *     summary: Get my transactions (driver accessing their own data)
 *     tags: [Driver Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [CREDIT, DEBIT]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PENALTY, TRIP, GIFT]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized - Not authenticated or not a driver
 */
router.get(
  "/me",
  validateQuery(
    z.object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      transactionType: z.enum(["CREDIT", "DEBIT"]).optional(),
      type: z.enum(["PENALTY", "TRIP", "GIFT"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ),
  async (req, res, next) => {
    // Check if user is a driver (has driver token)
    if (!(req as any).driver) {
      return res.status(403).json({ error: "Only drivers can access their own transactions" });
    }
    // Set driverId from authenticated driver
    req.query.driverId = (req as any).driver.driverId;
    return getDriverTransactionsList(req, res, next);
  }
);

/**
 * @swagger
 * /api/driver-transactions/me/summary:
 *   get:
 *     summary: Get my transaction summary (driver accessing their own data)
 *     tags: [Driver Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *       401:
 *         description: Unauthorized - Not authenticated or not a driver
 */
router.get(
  "/me/summary",
  validateQuery(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ),
  async (req, res, next) => {
    // Check if user is a driver (has driver token)
    if (!(req as any).driver) {
      return res.status(403).json({ error: "Only drivers can access their own summary" });
    }
    // Set driverId from authenticated driver
    req.params.driverId = (req as any).driver.driverId;
    return getDriverTransactionSummary(req, res, next);
  }
);


/**
 * @swagger
 * /api/driver-transactions:
 *   post:
 *     summary: Create a new driver transaction
 *     tags: [Driver Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverId
 *               - amount
 *               - transactionType
 *               - type
 *             properties:
 *               driverId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               transactionType:
 *                 type: string
 *                 enum: [CREDIT, DEBIT]
 *               tripId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [PENALTY, TRIP]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Driver or trip not found
 */
router.post(
  "/",
  requireRole(...allowedRoles),
  validate(
    z.object({
      driverId: z.string().uuid("Invalid driver ID format"),
      amount: z.number().positive("Amount must be positive"),
      transactionType: z.enum(["CREDIT", "DEBIT"]),
      tripId: z.string().uuid("Invalid trip ID format").optional().or(z.literal("")),
      type: z.enum(["PENALTY", "TRIP", "GIFT"]),
      description: z.string().optional().or(z.literal("")),
    })
  ),
  createDriverTransaction
);

/**
 * @swagger
 * /api/driver-transactions:
 *   get:
 *     summary: Get paginated list of driver transactions with filters
 *     tags: [Driver Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [CREDIT, DEBIT]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PENALTY, TRIP]
 *       - in: query
 *         name: tripId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  requireRole(...allowedRoles),
  validateQuery(
    z.object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      driverId: z.string().uuid("Invalid driver ID format").optional(),
      transactionType: z.enum(["CREDIT", "DEBIT"]).optional(),
      type: z.enum(["PENALTY", "TRIP", "GIFT"]).optional(),
      tripId: z.string().uuid("Invalid trip ID format").optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ),
  getDriverTransactionsList
);

/**
 * @swagger
 * /api/driver-transactions/{id}:
 *   get:
 *     summary: Get a single transaction by ID
 *     tags: [Driver Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaction not found
 */
router.get("/:id", requireRole(...allowedRoles), getDriverTransactionById);

/**
 * @swagger
 * /api/driver-transactions/driver/{driverId}:
 *   get:
 *     summary: Get all transactions for a specific driver
 *     tags: [Driver Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Driver not found
 */
router.get("/driver/:driverId", requireRole(...allowedRoles), getTransactionsByDriver);

/**
 * @swagger
 * /api/driver-transactions/driver/{driverId}/summary:
 *   get:
 *     summary: Get driver transaction summary (total credits, debits, balance)
 *     tags: [Driver Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Driver not found
 */
router.get("/driver/:driverId/summary", requireRole(...allowedRoles), getDriverTransactionSummary);

/**
 * @swagger
 * /api/driver-transactions/trip/{tripId}:
 *   get:
 *     summary: Get transactions for a specific trip
 *     tags: [Driver Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Trip not found
 */
router.get("/trip/:tripId", requireRole(...allowedRoles), getTransactionsByTrip);

export default router;
