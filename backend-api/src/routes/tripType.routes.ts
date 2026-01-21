import express from "express";
import {
  listTripTypesHandler,
  getTripTypeByIdHandler,
  createTripTypeHandler,
  updateTripTypeHandler,
  deleteTripTypeHandler,
} from "../controllers/tripType.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// All trip type routes require authentication
router.use(authMiddleware);

// List all trip types (any authenticated user can view)
router.get("/", listTripTypesHandler);

// Get trip type by ID (any authenticated user can view)
router.get("/:id", getTripTypeByIdHandler);

// Create, update, delete - only ADMIN and MANAGER
router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  createTripTypeHandler
);
router.put(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  updateTripTypeHandler
);
router.delete(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  deleteTripTypeHandler
);

export default router;
