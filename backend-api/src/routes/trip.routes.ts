import express from "express";
import {
  getTrips,
  getTripByIdHandler,
  createTripHandler,
  createTripPhase1Handler,
  driverAcceptTripHandler,
  driverRejectTripHandler,
  driverCancelTripHandler,
  rescheduleTripHandler,
  cancelTripHandler,
  reassignDriverToTripHandler,
  getUnassignedTripsHandler,
  getAssignedTripsHandler,
  getAvailableDriversForTripHandler,
  getAvailableDriversSortedByRatingHandler,
  assignDriverToTripHandler,
  assignDriverToTripWithFranchiseHandler,
  getDriverAssignedTripsHandler,
  getMyAssignedTripsHandler,
  getMyTripsHandler,
  initiateStartTripHandler,
  verifyAndStartTripHandler,
  initiateEndTripHandler,
  verifyAndEndTripHandler,
  collectPaymentHandler,
  verifyPaymentAndEndTripHandler,
  getTripHistoryHandler,
  getTripLogsHandler,
  requestTripDriversHandler,
  endTripDirectHandler,
  updateTripLiveLocationHandler,
} from "../controllers/trip.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, validateParams } from "../middlewares/validation";
import {
  rescheduleTripSchema,
  cancelTripSchema,
  reassignDriverSchema,
  assignDriverSchema,
} from "../types/trip.dto";
import { TRIP_ERROR_MESSAGES } from "../constants/trip";
import { z } from "zod";

const router = express.Router();

// All trip routes require authentication
router.use(authMiddleware);

router.get("/", getTrips);
router.get("/unassigned", getUnassignedTripsHandler);
router.get("/assigned", getAssignedTripsHandler);
router.get("/driver/assigned", getDriverAssignedTripsHandler);
router.get("/my-assigned", getMyAssignedTripsHandler);
router.get("/my", getMyTripsHandler);
router.get("/:id/available-drivers", getAvailableDriversForTripHandler);
router.get("/:id/available", getAvailableDriversSortedByRatingHandler);
router.get("/:id", getTripByIdHandler);
router.post("/", createTripHandler);
router.post("/phase1", createTripPhase1Handler);
router.post(
  "/assign-driver",
  validate(assignDriverSchema),
  assignDriverToTripWithFranchiseHandler
);
router.post("/:id/assign-driver", assignDriverToTripHandler);


const requestTripDriversSchema = z
  .object({
    mode: z.enum(["ALL", "SPECIFIC", "LIST"]).optional().default("ALL"),
    driverId: z.string().uuid("Invalid driver ID format").optional(),
    driverIds: z.array(z.string().uuid("Invalid driver ID format")).optional(),
  })
  .refine(
    (v) => {
      if (v.mode === "SPECIFIC") return Boolean(v.driverId);
      if (v.mode === "LIST") return Array.isArray(v.driverIds) && v.driverIds.length > 0;
      return true;
    },
    // Use superRefine so we can add dynamic, contextual issues
  )
  .superRefine((v, ctx) => {
    if (v.mode === "SPECIFIC" && !v.driverId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: TRIP_ERROR_MESSAGES.DISPATCH_MISSING_DRIVER_ID,
        path: ["driverId"],
      });
    }

    if (v.mode === "LIST" && (!Array.isArray(v.driverIds) || v.driverIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: TRIP_ERROR_MESSAGES.DISPATCH_MISSING_DRIVER_IDS,
        path: ["driverIds"],
      });
    }
  });

router.post(
  "/:id/request-drivers",
  validateParams(z.object({ id: z.string().uuid("Invalid trip ID format") })),
  validate(requestTripDriversSchema),
  requestTripDriversHandler
);

router.patch("/:id/driver-accept", driverAcceptTripHandler);
router.patch("/:id/driver-reject", driverRejectTripHandler);
router.post("/:id/driver-cancel", driverCancelTripHandler);

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

router.post("/:id/end-direct", endTripDirectHandler);

router.post(
  "/:id/live-location",
  validateParams(z.object({ id: z.string().uuid("Invalid trip ID format") })),
  updateTripLiveLocationHandler
);

router.get("/:id/history", getTripHistoryHandler);
router.get("/:id/logs", getTripLogsHandler);

export default router;
