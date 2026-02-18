// src/routes/holiday.routes.ts
import express from "express";
import {
  getHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getKeralaPublicHolidays,
  bulkCreateKeralaHolidays,
} from "../services/holiday.service";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { validate, validateParams, validateQuery } from "../middlewares/validation";
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Holiday type enum (matches Prisma schema)
enum HolidayType {
  PUBLIC = "PUBLIC",
  COMPANY = "COMPANY",
  OPTIONAL = "OPTIONAL",
}

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const createHolidaySchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  type: z.nativeEnum(HolidayType).optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().optional(),
  franchiseId: z.string().uuid().optional().nullable(),
});

const updateHolidaySchema = z.object({
  name: z.string().min(1).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  type: z.nativeEnum(HolidayType).optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

const holidayFiltersSchema = z.object({
  franchiseId: z.string().uuid().optional(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  type: z.nativeEnum(HolidayType).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const bulkCreateSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  franchiseId: z.string().uuid().optional().nullable(),
});

// GET /holidays - List all holidays
router.get(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateQuery(holidayFiltersSchema),
  async (req, res, next) => {
    try {
      const filters = req.query;
      
      // Managers can only see their franchise holidays + global holidays
      if (req.user?.role === UserRole.MANAGER && req.user?.franchiseId) {
        filters.franchiseId = req.user.franchiseId;
      }

      const holidays = await getHolidays(filters);
      res.json({
        success: true,
        count: holidays.length,
        data: holidays,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /holidays/public-kerala - Get predefined Kerala public holidays
router.get(
  "/public-kerala",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res, next) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const holidays = getKeralaPublicHolidays(year);
      res.json({
        success: true,
        count: holidays.length,
        data: holidays,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /holidays/bulk-kerala - Bulk create Kerala public holidays
router.post(
  "/bulk-kerala",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(bulkCreateSchema),
  async (req, res, next) => {
    try {
      const { year, franchiseId } = req.body;
      const createdBy = req.user!.userId;

      // Managers can only create for their franchise
      let targetFranchiseId = franchiseId;
      if (req.user?.role === UserRole.MANAGER) {
        targetFranchiseId = req.user.franchiseId;
      }

      const result = await bulkCreateKeralaHolidays(year, targetFranchiseId || null, createdBy);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /holidays/:id - Get holiday by ID
router.get(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ id: z.string().uuid("Invalid holiday ID") })),
  async (req, res, next) => {
    try {
      const holiday = await getHolidayById(req.params.id as string);
      res.json({
        success: true,
        data: holiday,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /holidays - Create new holiday
router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(createHolidaySchema),
  async (req, res, next) => {
    try {
      const { name, date, type, description, isRecurring, franchiseId } = req.body;
      const createdBy = req.user!.userId;

      // Managers can only create for their franchise
      let targetFranchiseId = franchiseId;
      if (req.user?.role === UserRole.MANAGER) {
        targetFranchiseId = req.user.franchiseId;
      }

      // Parse date string to Date object
      const parsedDate = new Date(date);

      const holiday = await createHoliday({
        name,
        date: parsedDate,
        type,
        description,
        isRecurring,
        franchiseId: targetFranchiseId,
        createdBy,
      });

      res.status(201).json({
        success: true,
        message: "Holiday created successfully",
        data: holiday,
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /holidays/:id - Update holiday
router.put(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ id: z.string().uuid("Invalid holiday ID") })),
  validate(updateHolidaySchema),
  async (req, res, next) => {
    try {
      const existingHoliday = await getHolidayById(req.params.id as string);

      // Managers can only update their franchise holidays
      if (req.user?.role === UserRole.MANAGER) {
        if (existingHoliday.franchiseId !== req.user.franchiseId) {
          return res.status(403).json({
            success: false,
            message: "You can only update holidays for your franchise",
          });
        }
      }

      const updateData: any = { ...req.body };
      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }

      const holiday = await updateHoliday(req.params.id as string, updateData);
      res.json({
        success: true,
        message: "Holiday updated successfully",
        data: holiday,
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /holidays/:id - Delete holiday
router.delete(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ id: z.string().uuid("Invalid holiday ID") })),
  async (req, res, next) => {
    try {
      const existingHoliday = await getHolidayById(req.params.id);

      // Managers can only delete their franchise holidays
      if (req.user?.role === UserRole.MANAGER) {
        if (existingHoliday.franchiseId !== req.user.franchiseId) {
          return res.status(403).json({
            success: false,
            message: "You can only delete holidays for your franchise",
          });
        }
      }

      const result = await deleteHoliday(req.params.id as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
