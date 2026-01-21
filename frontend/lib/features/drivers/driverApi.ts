/**
 * Driver API Module
 * 
 * All API calls use the axios instance with interceptors configured in '../../axios'
 * The interceptors automatically:
 * - Add Authorization header with Bearer token from localStorage
 * - Handle 401 errors by refreshing the access token
 * - Retry failed requests after token refresh
 * - Redirect to login if refresh token expires
 */
import api from '../../axios';

// API Endpoints
const DRIVER_ENDPOINTS = {
    BASE: '/drivers',
    BY_ID: (id: string) => `/drivers/${id}`,
    STATUS: (id: string) => `/drivers/${id}/status`,
    LOGIN: '/drivers/login',
} as const;

// Request DTOs (matching backend)
export interface CreateDriverRequest {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    altPhone?: string;
    password: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    licenseNumber: string;
    licenseExpDate: Date | string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankIfscCode: string;
    aadharCard?: boolean;
    license?: boolean;
    educationCert?: boolean;
    previousExp?: boolean;
    carTypes: ('MANUAL' | 'AUTOMATIC' | 'PREMIUM_CARS' | 'LUXURY_CARS' | 'SPORTY_CARS')[];
    franchiseId: string;
}

export interface UpdateDriverRequest {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    altPhone?: string | null;
    password?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    licenseNumber?: string;
    licenseExpDate?: Date | string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    aadharCard?: boolean;
    license?: boolean;
    educationCert?: boolean;
    previousExp?: boolean;
    carTypes?: ('MANUAL' | 'AUTOMATIC' | 'PREMIUM_CARS' | 'LUXURY_CARS' | 'SPORTY_CARS')[];
    franchiseId?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'TERMINATED';
}

export interface UpdateDriverStatusRequest {
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'TERMINATED';
}

export interface DriverLoginRequest {
    driverCode: string;
    password: string;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
}

// Response DTOs (matching backend)
export interface DriverResponse {
    id: string;
    franchiseId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    altPhone: string | null;
    driverCode: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    licenseNumber: string;
    licenseExpDate: Date | string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankIfscCode: string;
    aadharCard: boolean;
    license: boolean;
    educationCert: boolean;
    previousExp: boolean;
    carTypes: ('MANUAL' | 'AUTOMATIC' | 'PREMIUM_CARS' | 'LUXURY_CARS' | 'SPORTY_CARS')[];
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'TERMINATED';
    complaintCount: number;
    bannedGlobally: boolean;
    dailyTargetAmount: number | null;
    currentRating: number | null;
    isActive: boolean;
    createdBy: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface CreateDriverResponse {
    message: string;
    data: DriverResponse;
}

export interface DriverListResponse {
    data: DriverResponse[];
}

export interface PaginatedDriverResponse {
    data: DriverResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface DriverStatusResponse {
    message: string;
    data: DriverResponse;
}

export interface DeleteDriverResponse {
    message: string;
}

export interface DriverLoginResponse {
    data: {
        accessToken: string;
        refreshToken: string;
        driver: {
            id: string;
            driverCode: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            status: string;
        };
    };
}

/**
 * Get list of drivers
 * Supports pagination via query parameters
 */
export async function getDriverList(
    pagination?: PaginationQuery
): Promise<DriverResponse[] | PaginatedDriverResponse> {
    const params = pagination
        ? {
              page: pagination.page?.toString() || '1',
              limit: pagination.limit?.toString() || '10',
          }
        : {};

    const response = await api.get<DriverListResponse | PaginatedDriverResponse>(
        DRIVER_ENDPOINTS.BASE,
        { params }
    );

    // Backend returns { data: [...] } for simple list or { data: [...], pagination: {...} } for paginated
    // If pagination exists in response, return paginated response
    if ('pagination' in response.data) {
        return response.data as PaginatedDriverResponse;
    }

    // Otherwise return simple list (extract data array)
    return (response.data as DriverListResponse).data;
}

/**
 * Get driver by ID
 */
export async function getDriverById(id: string): Promise<DriverResponse> {
    const response = await api.get<{ data: DriverResponse }>(DRIVER_ENDPOINTS.BY_ID(id));
    return response.data.data;
}

/**
 * Create a new driver
 */
export async function createDriver(data: CreateDriverRequest): Promise<CreateDriverResponse> {
    const response = await api.post<CreateDriverResponse>(DRIVER_ENDPOINTS.BASE, data);
    return response.data;
}

/**
 * Update driver
 */
export async function updateDriver(
    id: string,
    data: UpdateDriverRequest
): Promise<{ message: string; data: DriverResponse }> {
    const response = await api.patch<{ message: string; data: DriverResponse }>(
        DRIVER_ENDPOINTS.BY_ID(id),
        data
    );
    return response.data;
}

/**
 * Update driver status (suspend, fire, block, activate)
 */
export async function updateDriverStatus(
    id: string,
    data: UpdateDriverStatusRequest
): Promise<DriverStatusResponse> {
    const response = await api.patch<DriverStatusResponse>(DRIVER_ENDPOINTS.STATUS(id), data);
    return response.data;
}

/**
 * Delete driver (soft delete)
 */
export async function deleteDriver(id: string): Promise<DeleteDriverResponse> {
    const response = await api.delete<DeleteDriverResponse>(DRIVER_ENDPOINTS.BY_ID(id));
    return response.data;
}

/**
 * Driver login
 */
export async function loginDriver(data: DriverLoginRequest): Promise<DriverLoginResponse> {
    const response = await api.post<DriverLoginResponse>(DRIVER_ENDPOINTS.LOGIN, data);
    return response.data;
}
