// src/routes/driver.routes.ts
import express from "express";
import { getDrivers, getDriverById } from "../controllers/driver.controller";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// All driver routes require authentication
router.use(authMiddleware);

router.get("/", getDrivers);
router.get("/:id", getDriverById);

export default router;
