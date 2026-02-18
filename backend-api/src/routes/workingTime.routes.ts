// src/routes/workingTime.routes.ts
import express from "express";
import {
  getWorkingTimeConfigs,
  getWorkingTimeConfigById,
  getWorkingTimeConfigByFranchiseAndRole,
  createWorkingTimeConfig,
  updateWorkingTimeConfig,
  upsertWorkingTimeConfig,
  deleteWorkingTimeConfig,
  RoleType,
} from "../services/workingTime.service";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { validate, validateParams, validateQuery } from "../middlewares/validation";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const createConfigSchema = z.object({
  franchiseId: z.string().uuid("Invalid franchise ID"),
  roleType: z.enum(["DRIVER", "STAFF", "MANAGER"]),
  minimumWorkHours: z.coerce.number().int().min(1).max(24).optional(),
  lunchBreakMinutes: z.coerce.number().int().min(0).max(180).optional(),
  snackBreakMinutes: z.coerce.number().int().min(0).max(60).optional(),
  gracePeriodMinutes: z.coerce.number().int().min(0).max(120).optional(),
  isActive: z.boolean().optional(),
});

const updateConfigSchema = z.object({
  minimumWorkHours: z.coerce.number().int().min(1).max(24).optional(),
  lunchBreakMinutes: z.coerce.number().int().min(0).max(180).optional(),
  snackBreakMinutes: z.coerce.number().int().min(0).max(60).optional(),
  gracePeriodMinutes: z.coerce.number().int().min(0).max(120).optional(),
  isActive: z.boolean().optional(),
});

const configFiltersSchema = z.object({
  franchiseId: z.string().uuid().optional(),
  roleType: z.enum(["DRIVER", "STAFF", "MANAGER"]).optional(),
  isActive: z.coerce.boolean().optional(),
});

// GET /working-time-config - List all configs
router.get(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateQuery(configFiltersSchema),
  async (req, res, next) => {
    try {
      const filters = req.query;

      // Managers can only see their franchise configs
      if (req.user?.role === UserRole.MANAGER && req.user?.franchiseId) {
        filters.franchiseId = req.user.franchiseId;
      }

      const configs = await getWorkingTimeConfigs(filters);
      res.json({
        success: true,
        count: configs.length,
        data: configs,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /working-time-config/:franchiseId/:roleType - Get specific config
router.get(
  "/:franchiseId/:roleType",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res, next) => {
    try {
      const { franchiseId, roleType } = req.params;

      // Managers can only access their franchise
      if (req.user?.role === UserRole.MANAGER) {
        if (franchiseId !== req.user.franchiseId) {
          return res.status(403).json({
            success: false,
            message: "You can only view configurations for your franchise",
          });
        }
      }

      const config = await getWorkingTimeConfigByFranchiseAndRole(
        franchiseId as string,
        roleType as RoleType
      );

      if (!config) {
        return res.status(404).json({
          success: false,
          message: "Working time configuration not found",
        });
      }

      res.json({
        success: true,
        data: config,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /working-time-config/:id - Get config by ID
router.get(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ id: z.string().uuid("Invalid config ID") })),
  async (req, res, next) => {
    try {
      const config = await getWorkingTimeConfigById(req.params.id as string);

      // Managers can only access their franchise configs
      if (req.user?.role === UserRole.MANAGER) {
        if (config.franchiseId !== req.user.franchiseId) {
          return res.status(403).json({
            success: false,
            message: "You can only view configurations for your franchise",
          });
        }
      }

      res.json({
        success: true,
        data: config,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /working-time-config - Create new config
router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(createConfigSchema),
  async (req, res, next) => {
    try {
      const { franchiseId, roleType, minimumWorkHours, lunchBreakMinutes, snackBreakMinutes, gracePeriodMinutes, isActive } = req.body;
      const createdBy = req.user!.userId;

      // Managers can only create for their franchise
      let targetFranchiseId = franchiseId;
      if (req.user?.role === UserRole.MANAGER) {
        targetFranchiseId = req.user.franchiseId;
        if (!targetFranchiseId) {
          return res.status(400).json({
            success: false,
            message: "Manager is not associated with any franchise",
          });
        }
      }

      const config = await createWorkingTimeConfig({
        franchiseId: targetFranchiseId,
        roleType: roleType as RoleType,
        minimumWorkHours,
        lunchBreakMinutes,
        snackBreakMinutes,
        gracePeriodMinutes,
        isActive,
        createdBy,
      });

      res.status(201).json({
        success: true,
        message: "Working time configuration created successfully",
        data: config,
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /working-time-config/:id - Update config
router.put(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ id: z.string().uuid("Invalid config ID") })),
  validate(updateConfigSchema),
  async (req, res, next) => {
    try {
      const existingConfig = await getWorkingTimeConfigById(req.params.id as string);

      // Managers can only update their franchise configs
      if (req.user?.role === UserRole.MANAGER) {
        if (existingConfig.franchiseId !== req.user.franchiseId) {
          return res.status(403).json({
            success: false,
            message: "You can only update configurations for your franchise",
          });
        }
      }

      const config = await updateWorkingTimeConfig(req.params.id as string, req.body);
      res.json({
        success: true,
        message: "Working time configuration updated successfully",
        data: config,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /working-time-config/upsert - Create or update config
router.post(
  "/upsert",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(createConfigSchema),
  async (req, res, next) => {
    try {
      const { franchiseId, roleType, minimumWorkHours, lunchBreakMinutes, snackBreakMinutes, gracePeriodMinutes, isActive } = req.body;
      const createdBy = req.user!.userId;

      // Managers can only upsert for their franchise
      let targetFranchiseId = franchiseId;
      if (req.user?.role === UserRole.MANAGER) {
        targetFranchiseId = req.user.franchiseId;
        if (!targetFranchiseId) {
          return res.status(400).json({
            success: false,
            message: "Manager is not associated with any franchise",
          });
        }
      }

      const config = await upsertWorkingTimeConfig({
        franchiseId: targetFranchiseId,
        roleType: roleType as RoleType,
        minimumWorkHours,
        lunchBreakMinutes,
        snackBreakMinutes,
        gracePeriodMinutes,
        isActive,
        createdBy,
      });

      res.status(200).json({
        success: true,
        message: "Working time configuration saved successfully",
        data: config,
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /working-time-config/:id - Delete config
router.delete(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(z.object({ id: z.string().uuid("Invalid config ID") })),
  async (req, res, next) => {
    try {
      const existingConfig = await getWorkingTimeConfigById(req.params.id as string);

      // Managers can only delete their franchise configs
      if (req.user?.role === UserRole.MANAGER) {
        if (existingConfig.franchiseId !== req.user.franchiseId) {
          return res.status(403).json({
            success: false,
            message: "You can only delete configurations for your franchise",
          });
        }
      }

      const result = await deleteWorkingTimeConfig(req.params.id as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
