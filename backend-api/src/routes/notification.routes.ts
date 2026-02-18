import express from "express";
import { authMiddleware } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  getNotificationsHandler,
  markAsReadHandler,
  markAllAsReadHandler,
} from "../controllers/notification.controller";
import { listNotificationsQuerySchema } from "../types/notification.dto";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// GET /api/notifications - Get My Notifications
// Access: All authenticated users
// ============================================
router.get(
  "/",
  getNotificationsHandler
);

// ============================================
// PATCH /api/notifications/read-all - Mark All as Read
// Access: All authenticated users
// ============================================
router.patch(
  "/read-all",
  markAllAsReadHandler
);

// ============================================
// PATCH /api/notifications/:id/read - Mark Single as Read
// Access: All authenticated users
// ============================================
router.patch(
  "/:id/read",
  markAsReadHandler
);

export default router;
