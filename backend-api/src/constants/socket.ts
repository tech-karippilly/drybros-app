// src/constants/socket.ts

export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECTION_ERROR: "connection_error",
  
  // Trip dispatch events (driver app)
  TRIP_OFFER: "trip_offer",
  TRIP_OFFER_ACCEPT: "trip_offer_accept",
  TRIP_OFFER_RESULT: "trip_offer_result",
  TRIP_ASSIGNED: "trip_assigned",
  TRIP_OFFER_CANCELLED: "trip_offer_cancelled",

  // Activity log events
  ACTIVITY_LOG_CREATED: "activity_log_created",
  ACTIVITY_LOG_UPDATED: "activity_log_updated",
  
  // Notification events
  NOTIFICATION_CREATED: "notification_created",
  NOTIFICATION_UPDATED: "notification_updated",
  NOTIFICATION_DELETED: "notification_deleted",
  
  // Room events
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  
  // Error events
  ERROR: "error",
} as const;

export const SOCKET_ROOMS = {
  // Room prefixes
  FRANCHISE_PREFIX: "franchise:",
  USER_PREFIX: "user:",
  DRIVER_PREFIX: "driver:",
  STAFF_PREFIX: "staff:",
  
  // Global rooms
  ALL_ADMINS: "room:all_admins",
  ALL_MANAGERS: "room:all_managers",
  ALL_DRIVERS: "room:all_drivers",
  ALL_STAFF: "room:all_staff",
} as const;

export const SOCKET_ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized connection attempt",
  INVALID_TOKEN: "Invalid authentication token",
  MISSING_TOKEN: "Missing authentication token",
  CONNECTION_FAILED: "Connection failed",
} as const;
