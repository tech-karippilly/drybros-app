import axios from 'axios';
import { STORAGE_KEYS } from './constants/auth';

// Get API URL from environment variable, fallback to default backend port
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
        // Validate and add Authorization header if access token exists
        // This applies to ALL requests including staff API calls
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            
            // Check if token exists and is valid (not empty)
            if (token && token.trim() !== '') {
                // Validate token format (basic check - JWT tokens have 3 parts separated by dots)
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    // Token appears valid, add to request
                    config.headers.Authorization = `Bearer ${token}`;
                } else {
                    // Invalid token format, clear it
                    console.warn('Invalid token format detected, clearing token');
                    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                    
                    // Redirect to login if not already on auth page
                    const currentPath = window.location.pathname;
                    const isAuthPage = currentPath.includes('/login') || 
                                     currentPath.includes('/register') ||
                                     currentPath.includes('/forgot-password') ||
                                     currentPath.includes('/reset-password');
                    
                    if (!isAuthPage) {
                        window.location.href = '/login';
                    }
                }
            } else {
                // No token found - for protected routes, this will be handled by 401 response
                // But we can optionally redirect here for certain endpoints
                const isProtectedRoute = config.url?.startsWith('/auth/me') || 
                                       config.url?.startsWith('/staff') ||
                                       config.url?.startsWith('/drivers') ||
                                       config.url?.startsWith('/customers');
                
                if (isProtectedRoute) {
                    // Token is missing for protected route
                    // Let the request proceed - 401 will be handled by response interceptor
                    console.warn('Access token missing for protected route:', config.url);
                }
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

        // Skip refresh token endpoint to avoid infinite loop
        if (originalRequest.url?.includes('/auth/refresh-token')) {
            return Promise.reject(error);
        }

        // Only handle 401 Unauthorized errors (not other errors like 400, 409, 500, etc.)
        if (error.response?.status === 401 && !originalRequest._retry) {
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
                const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Attempt to refresh token
                const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
                    refreshToken,
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

                // Check if refresh token is actually expired/invalid
                const isRefreshTokenExpired = 
                    refreshError?.response?.status === 401 ||
                    refreshError?.response?.status === 400 ||
                    !refreshError?.response; // Network error

                if (isRefreshTokenExpired) {
                    // Clear tokens and redirect to login only if refresh token is expired
                    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

                    // Only redirect if not already on an auth page
                    if (typeof window !== 'undefined') {
                        const currentPath = window.location.pathname;
                        const isAuthPage = currentPath.includes('/login') || 
                                         currentPath.includes('/register') ||
                                         currentPath.includes('/forgot-password') ||
                                         currentPath.includes('/reset-password');
                        
                        if (!isAuthPage) {
                            window.location.href = '/login';
                        }
                    }
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // For all other errors (400, 409, 500, etc.), just reject without redirecting
        // This allows components to handle validation errors, conflicts, etc.
        return Promise.reject(error);
    }
);

export default api;
