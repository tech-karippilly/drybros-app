/**
 * Socket.IO (driver app) event constants
 */

export const SOCKET_EVENTS = {
  TRIP_OFFER: 'trip_offer',
  TRIP_OFFER_ACCEPT: 'trip_offer_accept',
  TRIP_OFFER_REJECT: 'trip_offer_reject',
  TRIP_OFFER_RESULT: 'trip_offer_result',
  TRIP_ASSIGNED: 'trip_assigned',
  TRIP_OFFER_CANCELLED: 'trip_offer_cancelled',
  /**
   * Fetch assigned trips via socket (path-style event for parity with REST route).
   */
  TRIPS_MY_ASSIGNED: '/trips/my-assigned',
} as const;

export const SOCKET_TIMINGS_MS = {
  /**
   * Debounce window for calling `/trips/my-assigned` after clock-in / state changes.
   */
  MY_ASSIGNED_DEBOUNCE: 2000,
  /**
   * Safety timeout for socket ack-based requests.
   */
  ACK_TIMEOUT: 8000,
} as const;

