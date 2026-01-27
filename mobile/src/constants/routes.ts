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
