/**
 * Activity stream / critical events configuration.
 * Used for polling /activities with selected franchise and debouncing.
 */

/** Poll interval (ms) for fetching activities (real-time feed). */
export const ACTIVITY_STREAM_POLL_MS = 10_000;

/** Debounce delay (ms) before (re)starting poll when franchise selection changes. */
export const ACTIVITY_STREAM_DEBOUNCE_MS = 400;

/** Max number of critical/recent activities to fetch per request. */
export const ACTIVITY_CRITICAL_LIMIT = 20;
