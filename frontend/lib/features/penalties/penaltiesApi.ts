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

// Penalty Response DTOs
export interface PenaltyResponse {
    id: string;
    name: string;
    description: string | null;
    amount: number;
    type: 'PENALTY' | 'DEDUCTION';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePenaltyRequest {
    name: string;
    description?: string;
    amount: number;
    type: 'PENALTY' | 'DEDUCTION';
    isActive?: boolean;
}

export interface UpdatePenaltyRequest {
    name?: string;
    description?: string | null;
    amount?: number;
    type?: 'PENALTY' | 'DEDUCTION';
    isActive?: boolean;
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
 * Get list of penalties
 */
export async function getPenalties(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    type?: 'PENALTY' | 'DEDUCTION';
}): Promise<{ data: PenaltyResponse[] } | { data: PenaltyResponse[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.type) queryParams.append('type', params.type);

    const response = await api.get<{ data: PenaltyResponse[] } | { data: PenaltyResponse[]; pagination: any }>(
        `${PENALTY_ENDPOINTS.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
}

/**
 * Get penalty by ID
 */
export async function getPenaltyById(id: string): Promise<{ data: PenaltyResponse }> {
    const response = await api.get<{ data: PenaltyResponse }>(
        `${PENALTY_ENDPOINTS.BASE}/${id}`
    );
    return response.data;
}

/**
 * Create penalty
 */
export async function createPenalty(data: CreatePenaltyRequest): Promise<{ message: string; data: PenaltyResponse }> {
    const response = await api.post<{ message: string; data: PenaltyResponse }>(
        PENALTY_ENDPOINTS.BASE,
        data
    );
    return response.data;
}

/**
 * Update penalty
 */
export async function updatePenalty(
    id: string,
    data: UpdatePenaltyRequest
): Promise<{ message: string; data: PenaltyResponse }> {
    const response = await api.patch<{ message: string; data: PenaltyResponse }>(
        `${PENALTY_ENDPOINTS.BASE}/${id}`,
        data
    );
    return response.data;
}

/**
 * Delete penalty
 */
export async function deletePenalty(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(
        `${PENALTY_ENDPOINTS.BASE}/${id}`
    );
    return response.data;
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
