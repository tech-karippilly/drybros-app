/**
 * Dashboard and app route paths. Use these for sidebar links and navigation.
 * All dashboard routes are under /dashboard.
 */
export const DASHBOARD_ROUTES = {
    HOME: '/dashboard',
    FRANCHISES: '/dashboard/franchises',
    STAFF: '/dashboard/staff',
    DRIVERS: '/dashboard/drivers',
    DRIVER_EARNINGS_CONFIG: '/dashboard/driver-earnings-config',
    REPORTS: '/dashboard/reports',
    TRIPS: '/dashboard/trips',
    TRIP_TYPES: '/dashboard/trip-types',
    BOOKING: '/dashboard/booking',
    UNASSIGNED_TRIPS: '/dashboard/unassigned-trips',
    COMPLAINTS: '/dashboard/complaints',
    ATTENDANCE: '/dashboard/attendance',
    LEAVE: '/dashboard/leave',
    LEAVE_REQUESTS: '/dashboard/leave-requests',
    RATINGS: '/dashboard/ratings',
    CUSTOMERS: '/dashboard/customers',
    NOTIFICATIONS: '/dashboard/notifications',
    SETTINGS: '/dashboard/settings',
    CASH_SETTLEMENT: '/dashboard/cash-settlement',
} as const;

/** External or non-dashboard routes (e.g. policies) */
export const APP_ROUTES = {
    POLICIES: '/policies',
    PENALTIES: '/penalties',
} as const;
