import express from "express";
import {
  getTrips,
  getTripByIdHandler,
  createTripHandler,
  createTripPhase1Handler,
  driverAcceptTripHandler,
  driverRejectTripHandler,
  generateStartOtpHandler,
  startTripHandler,
  generateEndOtpHandler,
  endTripHandler,
  getUnassignedTripsHandler,
  getAvailableDriversForTripHandler,
  assignDriverToTripHandler,
} from "../controllers/trip.controller";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// All trip routes require authentication
router.use(authMiddleware);

router.get("/", getTrips);
router.get("/unassigned", getUnassignedTripsHandler);
router.get("/:id/available-drivers", getAvailableDriversForTripHandler);
router.get("/:id", getTripByIdHandler);
router.post("/", createTripHandler);
router.post("/phase1", createTripPhase1Handler);
router.post("/:id/assign-driver", assignDriverToTripHandler);

router.patch("/:id/driver-accept", driverAcceptTripHandler);
router.patch("/:id/driver-reject", driverRejectTripHandler);

router.post("/:id/generate-start-otp", generateStartOtpHandler);
router.patch("/:id/start", startTripHandler);
router.post("/:id/generate-end-otp", generateEndOtpHandler);
router.patch("/:id/end", endTripHandler);

export default router;
