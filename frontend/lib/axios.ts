import axios from 'axios';
import { STORAGE_KEYS, AUTH_API_ENDPOINTS } from './constants/auth';
import { API_BASE_URL } from './constants/api';
import { triggerRefreshTokenExpired } from './utils/tokenRefresh';

// Use centralized API URL configuration
const BASE_URL = API_BASE_URL;

// Create Axios instance
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Variables to handle token refreshing
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        // Add Authorization header if access token exists
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh token endpoint itself to avoid infinite loop
        if (originalRequest.url?.includes('/auth/refresh-token')) {
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Check if this is a refresh token expired error from previous attempt
            if (error.message === 'REFRESH_TOKEN_EXPIRED') {
                // Already handled, suppress error
                return Promise.reject(new Error('REFRESH_TOKEN_EXPIRED'));
            }
            
            if (isRefreshing) {
                // If already refreshing, queue the request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshTokenValue = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

                if (!refreshTokenValue) {
                    throw new Error('No refresh token available');
                }

                // Attempt to refresh token using axios directly (avoid circular dependency)
                // Use axios directly instead of api instance to avoid interceptor loop
                const response = await axios.post(`${BASE_URL}${AUTH_API_ENDPOINTS.REFRESH_TOKEN}`, {
                    refreshToken: refreshTokenValue,
                });

                // Backend returns { data: { accessToken, refreshToken, user } }
                const tokenData = response.data.data || response.data;
                const { accessToken, refreshToken: newRefreshToken } = tokenData;

                // Save new tokens
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
                if (newRefreshToken) {
                    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
                }

                // Update default headers
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                // Retry queued requests
                processQueue(null, accessToken);

                // Retry original request
                return api(originalRequest);
            } catch (refreshError: any) {
                processQueue(refreshError, null);

                // Check if refresh token expired or invalid
                // 400 = Bad Request (invalid token format/expired)
                // 401 = Unauthorized (token expired/invalid)
                const errorStatus = refreshError?.response?.status;
                const errorMessage = refreshError?.response?.data?.error || refreshError?.message || '';
                const errorMessageLower = errorMessage.toLowerCase();

                const isRefreshTokenExpired = 
                    errorStatus === 401 ||
                    errorStatus === 400 ||
                    errorMessageLower.includes('expired') ||
                    errorMessageLower.includes('invalid') ||
                    errorMessageLower.includes('token');

                if (isRefreshTokenExpired) {
                    // Clear tokens
                    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

                    // Trigger refresh token expired modal
                    triggerRefreshTokenExpired();
                    
                    // Suppress error - don't show axios error, just show modal
                    // Return a silent rejection to prevent error from bubbling up
                    return Promise.reject(new Error('REFRESH_TOKEN_EXPIRED'));
                } else {
                    // Other errors - clear tokens and redirect to login
                    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

                    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
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
