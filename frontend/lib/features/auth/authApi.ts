import api from '../../axios';
import { AUTH_API_ENDPOINTS } from '../../constants/auth';

export interface RegisterAdminRequest {
    name: string;
    email: string;
    password: string;
    phone?: string | null;
}

export interface RegisterAdminResponse {
    message: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

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

export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    message: string;
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
}

export interface ResetPasswordResponse {
    message: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
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

export interface LogoutResponse {
    message: string;
}

export interface CurrentUserResponse {
    data: {
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        role: string;
        isActive: boolean;
    };
}

/**
 * Get current authenticated user
 * Requires authentication (Bearer token in header)
 */
export async function getCurrentUser(): Promise<CurrentUserResponse['data']> {
    const response = await api.get<CurrentUserResponse>(
        AUTH_API_ENDPOINTS.GET_CURRENT_USER
    );
    return response.data.data;
}

/**
 * Register a new admin user
 */
export async function registerAdmin(
    data: RegisterAdminRequest
): Promise<RegisterAdminResponse> {
    const response = await api.post<RegisterAdminResponse>(
        AUTH_API_ENDPOINTS.REGISTER_ADMIN,
        data
    );
    return response.data;
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<LoginResponse['data']> {
    const response = await api.post<LoginResponse>(
        AUTH_API_ENDPOINTS.LOGIN,
        data
    );
    return response.data.data;
}

/**
 * Request password reset
 */
export async function forgotPassword(
    data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
    const response = await api.post<ForgotPasswordResponse>(
        AUTH_API_ENDPOINTS.FORGOT_PASSWORD,
        data
    );
    return response.data;
}

/**
 * Reset password with token
 */
export async function resetPassword(
    data: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
    const response = await api.post<ResetPasswordResponse>(
        AUTH_API_ENDPOINTS.RESET_PASSWORD,
        data
    );
    return response.data;
}

/**
 * Refresh access token
 */
export async function refreshToken(
    data: RefreshTokenRequest
): Promise<RefreshTokenResponse['data']> {
    const response = await api.post<RefreshTokenResponse>(
        AUTH_API_ENDPOINTS.REFRESH_TOKEN,
        data
    );
    return response.data.data;
}

/**
 * Logout user
 * Requires authentication (Bearer token in header)
 */
export async function logout(): Promise<LogoutResponse> {
    const response = await api.post<LogoutResponse>(
        AUTH_API_ENDPOINTS.LOGOUT
    );
    return response.data;
}
