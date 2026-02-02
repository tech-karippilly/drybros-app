import express from "express";
import { authMiddleware } from "../middlewares/auth";
import { validateQuery } from "../middlewares/validation";
import { driverAlertsQuerySchema } from "../types/alerts.dto";
import { getMyDriverAlertsHandler } from "../controllers/alerts.controller";

const router = express.Router();

// Driver token required
router.use(authMiddleware);

// GET /alerts/my
router.get("/my", validateQuery(driverAlertsQuerySchema), getMyDriverAlertsHandler);

export default router;

