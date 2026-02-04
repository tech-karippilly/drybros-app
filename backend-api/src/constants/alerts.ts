import { ActivityAction } from "@prisma/client";

export const ALERT_TYPES = {
  INCOMING_REQUEST: "INCOMING_REQUEST",
  TRIP_ASSIGNED: "TRIP_ASSIGNED",
  TRIP_ACCEPTED: "TRIP_ACCEPTED",
  TRIP_REJECTED: "TRIP_REJECTED",
  RIDE_STARTED: "RIDE_STARTED",
  RIDE_ENDED: "RIDE_ENDED",
} as const;

export type AlertType = (typeof ALERT_TYPES)[keyof typeof ALERT_TYPES];

/**
 * Activity actions that should appear in the driver's Alerts screen.
 */
export const DRIVER_ALERT_ACTIVITY_ACTIONS: readonly ActivityAction[] = [
  ActivityAction.TRIP_ASSIGNED,
  ActivityAction.TRIP_ACCEPTED,
  ActivityAction.TRIP_REJECTED,
  ActivityAction.TRIP_STARTED,
  ActivityAction.TRIP_ENDED,
] as const;

export const ALERT_TITLES = {
  INCOMING_REQUEST: "Incoming trip request",
  TRIP_ASSIGNED: "Trip assigned",
  TRIP_ACCEPTED: "Trip accepted",
  TRIP_REJECTED: "Trip rejected",
  RIDE_STARTED: "Ride started",
  RIDE_ENDED: "Ride ended",
} as const;

export const ALERT_MESSAGES = {
  INCOMING_REQUEST: "You have a new trip request.",
  TRIP_ASSIGNED: "A new trip has been assigned to you.",
  TRIP_ACCEPTED: "You accepted the trip request.",
  TRIP_REJECTED: "You rejected the trip request.",
  RIDE_STARTED: "Trip started successfully.",
  RIDE_ENDED: "Trip ended successfully.",
} as const;

export const ALERT_DEFAULTS = {
  EVENTS_LIMIT: 50,
} as const;

