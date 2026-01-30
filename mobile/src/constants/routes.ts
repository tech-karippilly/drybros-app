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
