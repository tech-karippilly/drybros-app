import express from "express";
import {
  getTrips,
  getTripByIdHandler,
  createTripHandler,
  driverAcceptTripHandler,
  driverRejectTripHandler,
  generateStartOtpHandler,
  startTripHandler,
  generateEndOtpHandler,
  endTripHandler,
} from "../controllers/trip.controller";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// All trip routes require authentication
router.use(authMiddleware);

router.get("/", getTrips);
router.get("/:id", getTripByIdHandler);
router.post("/", createTripHandler);

router.patch("/:id/driver-accept", driverAcceptTripHandler);
router.patch("/:id/driver-reject", driverRejectTripHandler);

router.post("/:id/generate-start-otp", generateStartOtpHandler);
router.patch("/:id/start", startTripHandler);
router.post("/:id/generate-end-otp", generateEndOtpHandler);
router.patch("/:id/end", endTripHandler);

export default router;
