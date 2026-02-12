export const DISPATCH_CONFIG = {
  /** Delay between offering to driver #1, #2, #3, ... - sequential offering */
  OFFER_INTERVAL_MS: 0, // Immediate sequential offers
  /** Offer validity window. Driver has 5 minutes to accept before offer expires */
  OFFER_TTL_MS: 5 * 60_000, // 5 minutes
  /** After first accept, wait briefly to see if another accept arrives. */
  ACCEPT_GRACE_MS: 15_000,
  /** Ignore driver locations older than this. */
  LOCATION_MAX_AGE_MS: 5 * 60_000,
  /** How often to check for expired offers (30 seconds) */
  EXPIRATION_CHECK_INTERVAL_MS: 30_000,
  /** Maximum number of drivers to offer a trip to before marking as unassignable */
  MAX_OFFER_ATTEMPTS_PER_TRIP: 10,
} as const;

/**
 * Rating tiers for dispatch priority.
 * Higher tier drivers should receive offers first.
 */
export const DISPATCH_RATING_TIERS = [5, 4, 3, 2, 1] as const;

export const DISPATCH_RATING = {
  MIN_TIER: 1,
  MAX_TIER: 5,
  /** Used when driver has no rating; sorted last */
  UNKNOWN_TIER: 0,
} as const;

/**
 * Pickup monitoring configuration.
 * Monitors accepted trips to ensure drivers are making progress toward pickup.
 */
export const PICKUP_MONITORING_CONFIG = {
  /** How often to check for stuck trips (60 seconds) */
  PICKUP_CHECK_INTERVAL_MS: 60_000,
  /** If driver hasn't made progress after this time, consider trip stuck (5 minutes) */
  NO_PROGRESS_TIMEOUT_MS: 5 * 60_000,
  /** If driver location older than this, consider location stale (3 minutes) */
  STALE_LOCATION_THRESHOLD_MS: 3 * 60_000,
  /** Maximum reasonable distance from pickup (50km) - beyond this, likely not heading there */
  MAX_PICKUP_DISTANCE_KM: 50,
} as const;
