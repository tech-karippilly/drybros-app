import express from "express";
import {
  getTrips,
  getTripByIdHandler,
  createTripHandler,
  createTripPhase1Handler,
  driverAcceptTripHandler,
  driverRejectTripHandler,
  rescheduleTripHandler,
  cancelTripHandler,
  reassignDriverToTripHandler,
  getUnassignedTripsHandler,
  getAssignedTripsHandler,
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
  getTripLogsHandler,
} from "../controllers/trip.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, validateParams } from "../middlewares/validation";
import {
  rescheduleTripSchema,
  cancelTripSchema,
  reassignDriverSchema,
  assignDriverSchema,
} from "../types/trip.dto";
import { z } from "zod";

const router = express.Router();

// All trip routes require authentication
router.use(authMiddleware);

router.get("/", getTrips);
router.get("/unassigned", getUnassignedTripsHandler);
router.get("/assigned", getAssignedTripsHandler);
router.get("/driver/assigned", getDriverAssignedTripsHandler);
router.get("/my-assigned", getMyAssignedTripsHandler);
router.get("/:id/available-drivers", getAvailableDriversForTripHandler);
router.get("/:id", getTripByIdHandler);
router.post("/", createTripHandler);
router.post("/phase1", createTripPhase1Handler);
router.post(
  "/assign-driver",
  validate(assignDriverSchema),
  assignDriverToTripWithFranchiseHandler
);
router.post("/:id/assign-driver", assignDriverToTripHandler);

router.patch("/:id/driver-accept", driverAcceptTripHandler);
router.patch("/:id/driver-reject", driverRejectTripHandler);

router.patch(
  "/:id/reschedule",
  validateParams(z.object({ id: z.string().uuid("Invalid trip ID format") })),
  validate(rescheduleTripSchema),
  rescheduleTripHandler
);
router.patch(
  "/:id/cancel",
  validateParams(z.object({ id: z.string().uuid("Invalid trip ID format") })),
  validate(cancelTripSchema),
  cancelTripHandler
);
router.patch(
  "/:id/reassign-driver",
  validateParams(z.object({ id: z.string().uuid("Invalid trip ID format") })),
  validate(reassignDriverSchema),
  reassignDriverToTripHandler
);

router.post(
  "/:id/start-initiate",
  validateParams(z.object({ id: z.string().uuid("Invalid trip ID format") })),
  initiateStartTripHandler
);
router.post("/:id/start-verify", verifyAndStartTripHandler);

router.post(
  "/:id/end-initiate",
  validateParams(z.object({ id: z.string().uuid("Invalid trip ID format") })),
  initiateEndTripHandler
);
router.post("/:id/end-verify", verifyAndEndTripHandler);

router.post("/:id/collect-payment", collectPaymentHandler);
router.post("/:id/verify-payment", verifyPaymentAndEndTripHandler);

router.get("/:id/history", getTripHistoryHandler);
router.get("/:id/logs", getTripLogsHandler);

export default router;
