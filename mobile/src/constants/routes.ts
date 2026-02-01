/**
 * Route and screen name constants for navigation
 */

export const TAB_ROUTES = {
  HOME: 'Home',
  TRIP: 'Trip',
  LEAVE: 'Leave',
  ALERTS: 'Alerts',
  PROFILE: 'Profile',
} as const;

export type TabRouteKey = keyof typeof TAB_ROUTES;

/**
 * Profile stack routes (nested under Profile tab)
 */
export const PROFILE_STACK_ROUTES = {
  PROFILE_HOME: 'ProfileHome',
  EARNINGS: 'Earnings',
  COMPLAINTS: 'Complaints',
} as const;

export type ProfileStackRouteKey = keyof typeof PROFILE_STACK_ROUTES;

/**
 * Leave stack routes (nested under Leave tab)
 */
export const LEAVE_STACK_ROUTES = {
  LEAVE_HOME: 'LeaveHome',
  APPLY_LEAVE: 'ApplyLeave',
} as const;

export type LeaveStackRouteKey = keyof typeof LEAVE_STACK_ROUTES;

/**
 * Trip stack routes (nested under Trip tab)
 */
export const TRIP_STACK_ROUTES = {
  TRIP_HOME: 'TripHome',
  TRIP_DETAILS: 'TripDetails',
  TRIP_START: 'TripStart',
} as const;

export type TripStackRouteKey = keyof typeof TRIP_STACK_ROUTES;
