import axios from 'axios';
import { STORAGE_KEYS, AUTH_API_ENDPOINTS, REFRESH_TOKEN_EXPIRED_ERROR } from './constants/auth';
import { API_BASE_URL } from './constants/api';
import { triggerRefreshTokenExpired } from './utils/tokenRefresh';

// Constants
const BASE_URL = API_BASE_URL;
const REFRESH_TOKEN_ENDPOINT = '/auth/refresh-token';

// Create Axios instance
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token refresh state
let isRefreshing = false;
type QueueItem = { resolve: (value: unknown) => void; reject: (reason?: unknown) => void };
let failedQueue: QueueItem[] = [];

// Helper functions
const clearTokens = (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

const processQueue = (error: unknown, token: string | null = null): void => {
    failedQueue.forEach((prom) => {
        error ? prom.reject(error) : prom.resolve(token);
    });
    failedQueue = [];
};

const isRefreshTokenExpiredError = (error: any): boolean => {
    const status = error?.response?.status;
    const message = (error?.response?.data?.error || error?.message || '').toLowerCase();
    
    return (
        status === 401 ||
        status === 400 ||
        message.includes('expired') ||
        message.includes('invalid') ||
        message.includes('token')
    );
};

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh token endpoint to avoid infinite loop
        if (originalRequest.url?.includes(REFRESH_TOKEN_ENDPOINT)) {
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Already handled refresh token expired error
            if (error.message === REFRESH_TOKEN_EXPIRED_ERROR) {
                return Promise.reject(new Error(REFRESH_TOKEN_EXPIRED_ERROR));
            }
            
            // Queue request if already refreshing
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            // Start token refresh
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshTokenValue = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
                if (!refreshTokenValue) {
                    throw new Error('No refresh token available');
                }

                // Use axios directly to avoid interceptor loop
                const response = await axios.post(
                    `${BASE_URL}${AUTH_API_ENDPOINTS.REFRESH_TOKEN}`,
                    { refreshToken: refreshTokenValue }
                );

                const tokenData = response.data.data || response.data;
                const { accessToken, refreshToken: newRefreshToken } = tokenData;

                // Save new tokens
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
                if (newRefreshToken) {
                    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
                }

                // Update headers
                const authHeader = `Bearer ${accessToken}`;
                api.defaults.headers.common['Authorization'] = authHeader;
                originalRequest.headers.Authorization = authHeader;

                // Process queued requests and retry original
                processQueue(null, accessToken);
                return api(originalRequest);
            } catch (refreshError: any) {
                processQueue(refreshError, null);

                if (isRefreshTokenExpiredError(refreshError)) {
                    clearTokens();
                    triggerRefreshTokenExpired();
                    return Promise.reject(new Error(REFRESH_TOKEN_EXPIRED_ERROR));
                }

                // Other errors - clear tokens and redirect
                clearTokens();
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
