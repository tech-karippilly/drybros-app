// src/routes/health.routes.js
import express from "express";
import { offerExpirationService } from "../services/offerExpiration.service";
import { pickupMonitoringService } from "../services/pickupMonitoring.service";
import { attendanceAggregationService } from "../services/attendanceAggregation.service";

const router = express.Router();

// GET /health
router.get("/", (req, res) => {
  const expirationServiceStatus = offerExpirationService.getStatus();
  const pickupMonitoringStatus = pickupMonitoringService.getStatus();
  const attendanceAggregationStatus = attendanceAggregationService.getStatus();
  
  res.json({
    status: "ok",
    message: "API is healthy 🚗",
    timestamp: new Date().toISOString(),
    services: {
      offerExpiration: {
        running: expirationServiceStatus.isRunning,
        intervalActive: expirationServiceStatus.intervalActive,
      },
      pickupMonitoring: {
        running: pickupMonitoringStatus.isRunning,
        intervalActive: pickupMonitoringStatus.intervalActive,
      },
      attendanceAggregation: {
        running: attendanceAggregationStatus.isRunning,
        intervalActive: attendanceAggregationStatus.intervalActive,
      },
    },
  });
});

export default router;
