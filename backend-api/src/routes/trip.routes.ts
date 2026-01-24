import express from "express";
import {
  getTrips,
  getTripByIdHandler,
  createTripHandler,
  createTripPhase1Handler,
  driverAcceptTripHandler,
  driverRejectTripHandler,
  getUnassignedTripsHandler,
  getAvailableDriversForTripHandler,
  assignDriverToTripHandler,
  assignDriverToTripWithFranchiseHandler,
  getDriverAssignedTripsHandler,
  getMyAssignedTripsHandler,
  initiateStartTripHandler,
  verifyAndStartTripHandler,
  initiateEndTripHandler,
  verifyAndEndTripHandler,
  collectPaymentHandler,
  verifyPaymentAndEndTripHandler,
  getTripHistoryHandler,
} from "../controllers/trip.controller";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// All trip routes require authentication
router.use(authMiddleware);

router.get("/", getTrips);
router.get("/unassigned", getUnassignedTripsHandler);
router.get("/driver/assigned", getDriverAssignedTripsHandler);
router.get("/my-assigned", getMyAssignedTripsHandler);
router.get("/:id/available-drivers", getAvailableDriversForTripHandler);
router.get("/:id", getTripByIdHandler);
router.post("/", createTripHandler);
router.post("/phase1", createTripPhase1Handler);
router.post("/assign-driver", assignDriverToTripWithFranchiseHandler);
router.post("/:id/assign-driver", assignDriverToTripHandler);

router.patch("/:id/driver-accept", driverAcceptTripHandler);
router.patch("/:id/driver-reject", driverRejectTripHandler);

router.post("/:id/start-initiate", initiateStartTripHandler);
router.post("/:id/start-verify", verifyAndStartTripHandler);

router.post("/:id/end-initiate", initiateEndTripHandler);
router.post("/:id/end-verify", verifyAndEndTripHandler);

router.post("/:id/collect-payment", collectPaymentHandler);
router.post("/:id/verify-payment", verifyPaymentAndEndTripHandler);

router.get("/:id/history", getTripHistoryHandler);

export default router;
