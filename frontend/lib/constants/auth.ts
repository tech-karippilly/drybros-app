export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
} as const;

export const AUTH_ROUTES = {
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
} as const;

export const ADMIN_DUMMY_USER = {
    _id: "user_123",
    name: "Admin User",
    email: "admin@drybros.com",
    role: "admin",
    franchise_name: "Main Branch",
    franchise_id: "fran_001"
} as const;

export const PASSWORD_VALIDATION_MESSAGES = {
    LENGTH: "Password must be at least 8 characters long.",
    UPPERCASE: "Password must contain at least one uppercase letter.",
    NUMBER: "Password must contain at least one number.",
    SPECIAL: "Password must contain at least one special character.",
} as const;
