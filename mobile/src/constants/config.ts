export const API_CONFIG ={
    BASE_URL:process.env.EXPO_PUBLIC_BASE_URL,
    TIMESOUT_MS:20000,
    AUTH_HEADER:'Authorization',
    AUTH_PREFIX:'Bearer',
}as const;