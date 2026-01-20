import api from '../../axios';
import { AUTH_API_ENDPOINTS } from '../../constants/auth';

// API Endpoints
const AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER_ADMIN: '/auth/register-admin',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    GET_CURRENT_USER: '/auth/me',
} as const;

// Request DTOs
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterAdminRequest {
    name: string;
    email: string;
    password: string;
    phone?: string | null;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

// Response DTOs
export interface LoginResponse {
    data: {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            phone: string | null;
            role: string;
        };
    };
}

export interface CurrentUserResponse {
    data: {
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        role: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
}

export interface RegisterAdminResponse {
    message: string;
}

export interface ForgotPasswordResponse {
    message: string;
}

export interface ResetPasswordResponse {
    message: string;
}

export interface RefreshTokenResponse {
    data: {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            phone: string | null;
            role: string;
        };
    };
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<LoginResponse['data']> {
    const response = await api.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, data);
    return response.data.data;
}

/**
 * Get current authenticated user
 * Requires authentication (Bearer token in header)
 */
export async function getCurrentUser(): Promise<CurrentUserResponse['data']> {
    const response = await api.get<CurrentUserResponse>(AUTH_ENDPOINTS.GET_CURRENT_USER);
    return response.data.data;
}

/**
 * Register admin
 */
export async function registerAdmin(data: RegisterAdminRequest): Promise<RegisterAdminResponse> {
    const response = await api.post<RegisterAdminResponse>(AUTH_ENDPOINTS.REGISTER_ADMIN, data);
    return response.data;
}

/**
 * Forgot password
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await api.post<ForgotPasswordResponse>(AUTH_ENDPOINTS.FORGOT_PASSWORD, data);
    return response.data;
}

/**
 * Reset password
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await api.post<ResetPasswordResponse>(AUTH_ENDPOINTS.RESET_PASSWORD, data);
    return response.data;
}

/**
 * Refresh access token
 */
export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse['data']> {
    const response = await api.post<RefreshTokenResponse>(AUTH_ENDPOINTS.REFRESH_TOKEN, data);
    return response.data.data;
}
