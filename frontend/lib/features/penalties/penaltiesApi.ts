/**
 * Penalties API Module
 * 
 * All API calls use the axios instance with interceptors configured in '../../axios'
 */
import api from '../../axios';

// API Endpoints
const PENALTY_ENDPOINTS = {
    BASE: '/penalties',
    APPLY_TO_DRIVER: (driverId: string) => `/penalties/apply/driver/${driverId}`,
    APPLY_TO_DRIVERS: '/penalties/apply/drivers',
    DRIVER_PENALTIES: '/penalties/driver-penalties',
    DRIVER_PENALTY_BY_ID: (id: string) => `/penalties/driver-penalties/${id}`,
    DAILY_LIMIT_DRIVER: (driverId: string) => `/penalties/daily-limit/driver/${driverId}`,
    DAILY_LIMIT_DRIVERS: '/penalties/daily-limit/drivers',
} as const;

// Request DTOs
export interface ApplyPenaltyToDriverRequest {
    penaltyId: string;
    amount?: number;
    reason?: string;
    violationDate?: string;
}

export interface ApplyPenaltyToDriversRequest {
    penaltyId: string;
    driverIds: string[];
    amount?: number;
    reason?: string;
    violationDate?: string;
}

export interface SetDriverDailyLimitRequest {
    dailyTargetAmount: number;
}

export interface SetDriversDailyLimitRequest {
    driverIds?: string[];
    franchiseId?: string;
    dailyTargetAmount: number;
}

// Response DTOs
export interface ApplyPenaltyToDriverResponse {
    message: string;
    data: {
        id: string;
        driverId: string;
        penaltyId: string;
        amount: number;
        reason?: string;
        violationDate?: string;
        appliedAt: string;
        appliedBy: string;
    };
}

export interface ApplyPenaltyToDriversResponse {
    message: string;
    data: Array<{
        id: string;
        driverId: string;
        penaltyId: string;
        amount: number;
        reason?: string;
        violationDate?: string;
        appliedAt: string;
        appliedBy: string;
    }>;
}

export interface DriverPenaltyResponse {
    id: string;
    driverId: string;
    penaltyId: string;
    penalty: {
        id: string;
        name: string;
        amount: number;
    };
    amount: number;
    reason?: string;
    violationDate?: string;
    appliedAt: string;
    appliedBy?: string;
    driver: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
    };
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
 * Apply penalty to a single driver
 */
export async function applyPenaltyToDriver(
    driverId: string,
    data: ApplyPenaltyToDriverRequest
): Promise<ApplyPenaltyToDriverResponse> {
    const response = await api.post<ApplyPenaltyToDriverResponse>(
        PENALTY_ENDPOINTS.APPLY_TO_DRIVER(driverId),
        data
    );
    return response.data;
}

/**
 * Apply penalty to multiple drivers
 */
export async function applyPenaltyToDrivers(
    data: ApplyPenaltyToDriversRequest
): Promise<ApplyPenaltyToDriversResponse> {
    const response = await api.post<ApplyPenaltyToDriversResponse>(
        PENALTY_ENDPOINTS.APPLY_TO_DRIVERS,
        data
    );
    return response.data;
}

/**
 * Get driver penalties
 */
export async function getDriverPenalties(params?: {
    page?: number;
    limit?: number;
    driverId?: string;
    penaltyId?: string;
    startDate?: string;
    endDate?: string;
}): Promise<{ data: DriverPenaltyResponse[] } | { data: DriverPenaltyResponse[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.driverId) queryParams.append('driverId', params.driverId);
    if (params?.penaltyId) queryParams.append('penaltyId', params.penaltyId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get<{ data: DriverPenaltyResponse[] } | { data: DriverPenaltyResponse[]; pagination: any }>(
        `${PENALTY_ENDPOINTS.DRIVER_PENALTIES}?${queryParams.toString()}`
    );
    return response.data;
}

/**
 * Get driver penalty by ID
 */
export async function getDriverPenaltyById(id: string): Promise<{ data: DriverPenaltyResponse }> {
    const response = await api.get<{ data: DriverPenaltyResponse }>(
        PENALTY_ENDPOINTS.DRIVER_PENALTY_BY_ID(id)
    );
    return response.data;
}

/**
 * Update driver penalty
 */
export async function updateDriverPenalty(
    id: string,
    data: Partial<ApplyPenaltyToDriverRequest>
): Promise<{ message: string; data: DriverPenaltyResponse }> {
    const response = await api.patch<{ message: string; data: DriverPenaltyResponse }>(
        PENALTY_ENDPOINTS.DRIVER_PENALTY_BY_ID(id),
        data
    );
    return response.data;
}

/**
 * Delete driver penalty
 */
export async function deleteDriverPenalty(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(
        PENALTY_ENDPOINTS.DRIVER_PENALTY_BY_ID(id)
    );
    return response.data;
}
