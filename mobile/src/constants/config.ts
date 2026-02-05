export const API_CONFIG = {
    BASE_URL: process.env.EXPO_PUBLIC_BASE_URL || 'http://192.168.31.53:4000',
    TIMESOUT_MS: 20000,
    AUTH_HEADER: 'Authorization',
    AUTH_PREFIX: 'Bearer',
} as const;
