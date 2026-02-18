/**
 * Route Configuration
 * Centralized route definitions for the application
 */

export const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify-otp',
  '/reset-password',
  '/unauthorized',
] as const;

export const authRoutes = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_OTP: '/verify-otp',
  RESET_PASSWORD: '/reset-password',
  UNAUTHORIZED: '/unauthorized',
} as const;

export const dashboardRoutes = {
  ADMIN: '/admin/dashboard',
  MANAGER: '/manager/dashboard',
  OFFICE_STAFF: '/staff/dashboard',
  STAFF: '/staff/dashboard',
} as const;

export const adminRoutes = {
  DASHBOARD: '/admin/dashboard',
  FRANCHISES: '/admin/franchises',
  FRANCHISE_CREATE: '/admin/franchises/create',
  FRANCHISE_DETAIL: (id: string) => `/admin/franchises/${id}`,
  FRANCHISE_EDIT: (id: string) => `/admin/franchises/${id}/edit`,
  MANAGERS: '/admin/managers',
  STAFF: '/admin/staff',
  DRIVERS: '/admin/drivers',
  TRIPS: '/admin/trips',
  REPORTS: '/admin/reports',
  SETTINGS: '/admin/settings',
} as const;

export const managerRoutes = {
  DASHBOARD: '/manager/dashboard',
  FRANCHISE: '/manager/franchise',
  STAFF: '/manager/staff',
  STAFF_DETAIL: (id: string) => `/manager/staff/${id}`,
  STAFF_EDIT: (id: string) => `/manager/staff/${id}/edit`,
  STAFF_CREATE: '/manager/staff/create',
  DRIVERS: '/manager/drivers',
  DRIVER_DETAIL: (id: string) => `/manager/drivers/${id}`,
  DRIVER_EDIT: (id: string) => `/manager/drivers/${id}/edit`,
  DRIVER_CREATE: '/manager/drivers/create',
  TRIPS: '/manager/trips',
  TRIP_DETAIL: (id: string) => `/manager/trips/${id}`,
  BOOKINGS: '/manager/bookings',
  ATTENDANCE: '/manager/attendance',
  FLEET: '/manager/fleet',
  REPORTS: '/manager/reports',
  SETTINGS: '/manager/settings',
} as const;

export const staffRoutes = {
  DASHBOARD: '/staff/dashboard',
  DRIVERS: '/staff/drivers',
  TRIPS: '/staff/trips',
  CUSTOMERS: '/staff/customers',
} as const;



/**
 * Get dashboard route based on user role
 */
export const getDashboardRoute = (role: string): string => {
  return dashboardRoutes[role as keyof typeof dashboardRoutes] || '/dashboard';
};

/**
 * Check if a route is public
 */
export const isPublicRoute = (pathname: string): boolean => {
  return publicRoutes.some(route => pathname.startsWith(route));
};

/**
 * Get allowed roles for a route prefix
 */
export const getAllowedRoles = (pathname: string): string[] => {
  if (pathname.startsWith('/admin')) return ['ADMIN'];
  if (pathname.startsWith('/manager')) return ['MANAGER'];
  if (pathname.startsWith('/staff')) return ['OFFICE_STAFF', 'STAFF'];
  return [];
};
