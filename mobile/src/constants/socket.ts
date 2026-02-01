/**
 * Socket.IO (driver app) event constants
 */

export const SOCKET_EVENTS = {
  TRIP_OFFER: 'trip_offer',
  TRIP_OFFER_ACCEPT: 'trip_offer_accept',
  TRIP_OFFER_RESULT: 'trip_offer_result',
  TRIP_ASSIGNED: 'trip_assigned',
  TRIP_OFFER_CANCELLED: 'trip_offer_cancelled',
} as const;

