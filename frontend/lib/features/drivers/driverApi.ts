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
import { Driver, DriverPerformanceMetrics, AvailableDriver } from '@/lib/types/driver';

// API Endpoints
const DRIVER_ENDPOINTS = {
    BASE: '/drivers',
    BY_ID: (id: string) => `/drivers/${id}`,
    STATUS: (id: string) => `/drivers/${id}/status`,
    LOGIN: '/drivers/login',
    WITH_PERFORMANCE: (id: string) => `/drivers/${id}/with-performance`,
    PERFORMANCE: (id: string) => `/drivers/${id}/performance`,
    PAGINATED: '/drivers/paginated',
    DAILY_LIMIT: (id: string) => `/drivers/${id}/daily-limit`,
    SUBMIT_CASH_SETTLEMENT: '/drivers/submit-cash-settlement',
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
    employmentType?: 'part time' | 'full time' | 'contract';
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
    employmentType?: 'part time' | 'full time' | 'contract' | null;
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
    cashInHand?: number | string; // Cash amount in driver's hand
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

/**
 * Get all drivers with optional performance metrics
 */
export async function getDrivers(params?: {
    includeInactive?: boolean;
    franchiseId?: string;
    includePerformance?: boolean;
}): Promise<Driver[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.includeInactive) {
        queryParams.append('includeInactive', 'true');
    }
    if (params?.franchiseId) {
        queryParams.append('franchiseId', params.franchiseId);
    }
    if (params?.includePerformance) {
        queryParams.append('includePerformance', 'true');
    }
    
    const response = await api.get<{ data: Driver[] }>(`${DRIVER_ENDPOINTS.BASE}?${queryParams.toString()}`);
    return response.data.data;
}

/**
 * Get driver by ID with performance metrics
 */
export async function getDriverWithPerformance(id: string): Promise<Driver> {
    const response = await api.get<{ data: Driver }>(DRIVER_ENDPOINTS.WITH_PERFORMANCE(id));
    return response.data.data;
}

/**
 * Get driver performance metrics only
 */
export async function getDriverPerformance(id: string): Promise<DriverPerformanceMetrics> {
    const response = await api.get<{ data: DriverPerformanceMetrics }>(DRIVER_ENDPOINTS.PERFORMANCE(id));
    return response.data.data;
}

/**
 * Get available drivers for a trip (sorted by performance)
 */
export async function getAvailableDriversForTrip(tripId: string): Promise<AvailableDriver[]> {
    const response = await api.get<{ data: AvailableDriver[] }>(`/trips/${tripId}/available-drivers`);
    return response.data.data;
}

/**
 * Get drivers by franchise(s)
 * Returns simplified driver data with performance status
 */
export interface DriverByFranchiseResponse {
    id: string;
    name: string;
    phone: string;
    availableStatus: "AVAILABLE" | "ON_TRIP";
    performanceStatus: "GREEN" | "YELLOW" | "RED";
    complaintsNumber: number;
    franchiseId: string;
}

export async function getDriversByFranchises(franchiseId: string): Promise<DriverByFranchiseResponse[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('franchiseId', franchiseId);
    
    const response = await api.get<{ data: DriverByFranchiseResponse[] }>(`${DRIVER_ENDPOINTS.BASE}/by-franchises?${queryParams.toString()}`);
    return response.data.data;
}

/**
 * Get paginated drivers with optional performance
 * Uses GET /drivers?page=&limit=
 */
export async function getDriversPaginated(params: {
    page?: number;
    limit?: number;
    franchiseId?: string;
    includePerformance?: boolean;
}): Promise<{
    data: Driver[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}> {
    const queryParams = new URLSearchParams();
    queryParams.set('page', String(params.page ?? 1));
    queryParams.set('limit', String(params.limit ?? 10));
    if (params.franchiseId) queryParams.append('franchiseId', params.franchiseId);
    if (params.includePerformance) queryParams.append('includePerformance', 'true');
    const response = await api.get<{
        data: Driver[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`${DRIVER_ENDPOINTS.BASE}?${queryParams.toString()}`);
    return response.data;
}

// Daily Limit APIs
export interface SetDriverDailyLimitRequest {
    dailyTargetAmount: number;
}

export interface SetDriversDailyLimitRequest {
    driverIds?: string[];
    franchiseId?: string;
    dailyTargetAmount: number;
}

export interface SetDriverDailyLimitResponse {
    message: string;
    driverId: string;
    dailyTargetAmount: number;
}

export interface SetDriversDailyLimitResponse {
    message: string;
    count: number;
    dailyTargetAmount: number;
}

/**
 * Set daily limit for a specific driver
 */
export async function setDriverDailyLimit(
    driverId: string,
    data: SetDriverDailyLimitRequest
): Promise<SetDriverDailyLimitResponse> {
    const response = await api.patch<SetDriverDailyLimitResponse>(
        `/penalties/daily-limit/driver/${driverId}`,
        data
    );
    return response.data;
}

/**
 * Set daily limit for multiple drivers
 */
export async function setDriversDailyLimit(
    data: SetDriversDailyLimitRequest
): Promise<SetDriversDailyLimitResponse> {
    const response = await api.patch<SetDriversDailyLimitResponse>(
        '/penalties/daily-limit/drivers',
        data
    );
    return response.data;
}

// Daily Limit Response DTOs
export interface DriverDailyLimitResponse {
    driverId: string;
    driverName: string;
    dailyTargetAmount: number;
    remainingDailyLimit: number;
    usedDailyLimit: number;
    cashInHand: number;
}

/**
 * Get driver daily limit information
 */
export async function getDriverDailyLimit(
    driverId: string
): Promise<DriverDailyLimitResponse> {
    const response = await api.get<{ data: DriverDailyLimitResponse }>(
        DRIVER_ENDPOINTS.DAILY_LIMIT(driverId)
    );
    return response.data.data;
}

/** Driver daily stats (GET /drivers/:id/daily-stats) */
export interface DriverDailyStatsResponse {
    driverId: string;
    date: string;
    dailyTargetAmount: number;
    amountRunToday: number;
    tripsCountToday: number;
    incentiveToday: number;
    incentiveType: string | null;
    remainingToAchieve: number;
}

export async function getDriverDailyStats(
    driverId: string,
    date?: string
): Promise<DriverDailyStatsResponse> {
    const params = date ? `?date=${encodeURIComponent(date)}` : '';
    const response = await api.get<{ data: DriverDailyStatsResponse }>(
        `/drivers/${driverId}/daily-stats${params}`
    );
    return response.data.data;
}

/** Driver monthly stats (GET /drivers/:id/monthly-stats) */
export interface DriverMonthlyStatsResponse {
    driverId: string;
    year: number;
    month: number;
    monthlyEarnings: number;
    tripsCount: number;
    monthlyBonus: number;
    bonusTier: unknown;
    monthlyDeductionPolicyCut: number;
    deductionTier: unknown;
}

export async function getDriverMonthlyStats(
    driverId: string,
    year: number,
    month: number
): Promise<DriverMonthlyStatsResponse> {
    const response = await api.get<{ data: DriverMonthlyStatsResponse }>(
        `/drivers/${driverId}/monthly-stats?year=${year}&month=${month}`
    );
    return response.data.data;
}

/** Driver settlement (GET /drivers/:id/settlement) */
export interface DriverSettlementResponse {
    driverId: string;
    year: number;
    month: number;
    [key: string]: unknown;
}

export async function getDriverSettlement(
    driverId: string,
    year: number,
    month: number
): Promise<DriverSettlementResponse> {
    const response = await api.get<{ data: DriverSettlementResponse }>(
        `/drivers/${driverId}/settlement?year=${year}&month=${month}`
    );
    return response.data.data;
}

/** Cash Settlement APIs */
export interface SubmitCashForSettlementRequest {
    driverId: string;
    settlementAmount: number;
}

export interface SubmitCashForSettlementResponse {
    driverId: string;
    driverName: string;
    message: string;
    previousCash: number;
    settlementAmount: number;
    remainingCash: number;
}

/**
 * Submit cash for settlement (reduce cash in hand by specified amount)
 */
export async function submitCashForSettlement(
    data: SubmitCashForSettlementRequest
): Promise<SubmitCashForSettlementResponse> {
    const response = await api.post<{ data: SubmitCashForSettlementResponse }>(
        DRIVER_ENDPOINTS.SUBMIT_CASH_SETTLEMENT,
        data
    );
    return response.data.data;
}
