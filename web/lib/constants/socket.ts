export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECTION_ERROR: "connection_error",
  
  // Trip dispatch events (driver app)
  TRIP_OFFER: "trip_offer",
  TRIP_OFFER_ACCEPT: "trip_offer_accept",
  TRIP_OFFER_REJECT: "trip_offer_reject",
  TRIP_OFFER_RESULT: "trip_offer_result",
  TRIP_ASSIGNED: "trip_assigned",
  TRIP_OFFER_CANCELLED: "trip_offer_cancelled",
  /**
   * Driver app: request assigned trips list via socket.
   * Kept as a path-style event for parity with REST route.
   */
  TRIPS_MY_ASSIGNED: "/trips/my-assigned",
  
  // Trip status events
  TRIP_ACCEPTED_BY_DRIVER: "trip_accepted_by_driver",
  TRIP_REJECTED_BY_DRIVER: "trip_rejected_by_driver",

  // Online status events
  STAFF_STATUS_CHANGED: "staff:status-changed",
  DRIVER_STATUS_CHANGED: "driver:status-changed",
  ONLINE_STAFF_LIST: "online:staff-list",
  ONLINE_DRIVERS_LIST: "online:drivers-list",
  GET_ONLINE_STAFF: "/online/staff",
  GET_ONLINE_DRIVERS: "/online/drivers",

  // Attendance events
  ATTENDANCE_CLOCK_IN: "attendance:clock-in",
  ATTENDANCE_CLOCK_OUT: "attendance:clock-out",
  ATTENDANCE_LOGIN: "attendance:login",
  ATTENDANCE_LOGOUT: "attendance:logout",

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
  
  // Your new event
  YOUR_NEW_EVENT: "your_new_event",
} as const;

export const SOCKET_ROOMS = {
  ALL_ADMINS: "all:admins",
  ALL_MANAGERS: "all:managers",
  ALL_STAFF: "all:staff",
  ALL_DRIVERS: "all:drivers",
  FRANCHISE_PREFIX: "franchise:",
  DRIVER_PREFIX: "driver:",
  STAFF_PREFIX: "staff:",
  USER_PREFIX: "user:",
} as const;