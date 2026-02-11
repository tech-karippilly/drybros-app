// src/routes/profile.routes.ts
import express from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  getMyProfileHandler,
  updateMyProfileHandler,
  resetMyPasswordHandler
} from "../controllers/profile.controller";
import { validate } from "../middlewares/validation";
import { updateProfileSchema, resetPasswordSchema } from "../types/profile.dto";

const router = express.Router();

// All profile routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: profile
 *   description: Profile management
 */

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get current user's profile details
 *     tags: [profile]
 *     responses:
 *       200:
 *         description: Profile details
 */
router.get("/", getMyProfileHandler);

/**
 * @swagger
 * /profile:
 *   patch:
 *     summary: Edit current user's profile details
 *     tags: [profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileDTO'
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch("/", validate(updateProfileSchema), updateMyProfileHandler);

/**
 * @swagger
 * /profile/reset-password:
 *   post:
 *     summary: Reset password (old and new password)
 *     tags: [profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordDTO'
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post("/reset-password", validate(resetPasswordSchema), resetMyPasswordHandler);

export default router;
