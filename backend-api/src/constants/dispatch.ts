export const DISPATCH_CONFIG = {
  /** Delay between offering to driver #1, #2, #3, ... */
  OFFER_INTERVAL_MS: 60_000,
  /** Offer validity window. Overlaps allow multiple accepts. */
  OFFER_TTL_MS: 120_000,
  /** After first accept, wait briefly to see if another accept arrives. */
  ACCEPT_GRACE_MS: 15_000,
  /** Ignore driver locations older than this. */
  LOCATION_MAX_AGE_MS: 5 * 60_000,
} as const;

