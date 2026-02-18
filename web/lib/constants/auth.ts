export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
} as const;

export const AUTH_API_ENDPOINTS = {
    REGISTER_ADMIN: '/auth/register-admin',
    LOGIN: '/auth/login',
    LOGIN_DRIVER: '/drivers/login',
    LOGIN_STAFF: '/staff/login',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_OTP: '/auth/verify-otp',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    GET_CURRENT_USER: '/auth/me',
} as const;

export const REFRESH_TOKEN_EXPIRED_ERROR = 'REFRESH_TOKEN_EXPIRED' as const;

export const AUTH_ROUTES = {
    LOGIN: '/login',
    LOGIN_USER: '/login/user',
    LOGIN_DRIVER: '/login/driver',
    LOGIN_STAFF: '/login/staff',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    FORGOT_PASSWORD: '/forgot-password',
    VERIFY_OTP: '/verify-otp',
    RESET_PASSWORD: '/reset-password',
} as const;

// Role-based dashboard routes
export const ROLE_DASHBOARD_ROUTES = {
    ADMIN: '/admin/dashboard',
    MANAGER: '/manager/dashboard',
    OFFICE_STAFF: '/staff/dashboard',
    STAFF: '/staff/dashboard',
    DRIVER: '/driver/dashboard',
} as const;
