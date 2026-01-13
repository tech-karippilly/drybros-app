export const API_ROOT = '/api/v1';

export const API_ENDPOINTS = {
    AUTH: {
        BASE: '/auth',
        LOGIN: '/login',
        REGISTER: '/register',
        LOGOUT: '/logout',
        REFRESH_TOKEN: '/refresh-token',
        FORGOT_PASSWORD: '/forgot-password',
        RESET_PASSWORD: '/reset-password',
        VERIFY_EMAIL: '/verify-email',
    },
    USERS: {
        BASE: '/users',
        GET_ALL: '/',
        GET_BY_ID: '/:id',
        UPDATE: '/:id',
        DELETE: '/:id',
        PROFILE: '/profile',
    },
    DRIVERS: {
        BASE: '/drivers',
        ONBOARD: '/onboard',
        DOCUMENTS: '/documents',
        STATUS: '/status',
        NEARBY: '/nearby',
        EARNINGS: '/earnings',
    },
    TRIPS: {
        BASE: '/trips',
        CREATE: '/',
        ESTIMATE: '/estimate',
        HISTORY: '/history',
        DETAILS: '/:id',
        UPDATE_STATUS: '/:id/status',
        CANCEL: '/:id/cancel',
        RATING: '/:id/rating',
    },
    PAYMENTS: {
        BASE: '/payments',
        PROCESS: '/process',
        WEBHOOK: '/webhook',
        HISTORY: '/history',
    },
    ADMIN: {
        BASE: '/admin',
        DASHBOARD: '/dashboard',
        SETTINGS: '/settings',
        REPORTS: '/reports',
    }
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
