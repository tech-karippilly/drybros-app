/**
 * Driver live location tracking constants
 */

export const LOCATION_TRACKING = {
  /** Minimum time between backend location updates */
  SEND_INTERVAL_MS: 10_000,
  /** Only send if moved at least this far (meters), when distance is available */
  MIN_DISTANCE_M: 25,
} as const;

