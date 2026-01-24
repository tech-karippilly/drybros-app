/**
 * Earnings Config API Module
 * 
 * All API calls use the axios instance with interceptors configured in '../../axios'
 */
import api from '../../axios';

// API Endpoints
const EARNINGS_CONFIG_ENDPOINTS = {
    BASE: '/config/driver-earnings',
    BY_FRANCHISE: (franchiseId: string) => `/config/driver-earnings/franchise/${franchiseId}`,
    BY_DRIVER: (driverId: string) => `/config/driver-earnings/driver/${driverId}`,
    BY_DRIVERS: '/config/driver-earnings/drivers',
    BY_FRANCHISES: '/config/driver-earnings/franchises',
} as const;

// Request DTOs
export interface UpdateEarningsConfigRequest {
    dailyTargetDefault?: number;
    incentiveTier1Min?: number;
    incentiveTier1Max?: number;
    incentiveTier1Type?: string;
    incentiveTier2Min?: number;
    incentiveTier2Percent?: number;
    monthlyBonusTiers?: Array<{
        minEarnings: number;
        bonus: number;
    }>;
    monthlyDeductionTiers?: Array<{
        maxEarnings: number;
        cutPercent: number;
    }>;
}

// Response DTOs
export interface EarningsConfigResponse {
    id?: string; // Optional for default config
    dailyTargetDefault: number;
    incentiveTier1Min: number;
    incentiveTier1Max: number;
    incentiveTier1Type: string;
    incentiveTier2Min: number;
    incentiveTier2Percent: number;
    monthlyBonusTiers: Array<{
        minEarnings: number;
        bonus: number;
    }> | null;
    monthlyDeductionTiers: Array<{
        maxEarnings: number;
        cutPercent: number;
    }> | null;
    isActive: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

/**
 * Get driver earnings configuration
 */
export async function getEarningsConfig(): Promise<{ data: EarningsConfigResponse }> {
    const response = await api.get<{ data: EarningsConfigResponse }>(
        EARNINGS_CONFIG_ENDPOINTS.BASE
    );
    return response.data;
}

/**
 * Update driver earnings configuration (global)
 */
export async function updateEarningsConfig(
    data: UpdateEarningsConfigRequest
): Promise<{ data: EarningsConfigResponse }> {
    const response = await api.patch<{ data: EarningsConfigResponse }>(
        EARNINGS_CONFIG_ENDPOINTS.BASE,
        data
    );
    return response.data;
}

/**
 * Get earnings config for a franchise
 */
export async function getEarningsConfigByFranchise(
    franchiseId: string
): Promise<{ data: EarningsConfigResponse }> {
    const response = await api.get<{ data: EarningsConfigResponse }>(
        EARNINGS_CONFIG_ENDPOINTS.BY_FRANCHISE(franchiseId)
    );
    return response.data;
}

/**
 * Set earnings config for a franchise
 */
export async function setFranchiseEarningsConfig(
    franchiseId: string,
    data: UpdateEarningsConfigRequest
): Promise<{ data: EarningsConfigResponse }> {
    const response = await api.post<{ data: EarningsConfigResponse }>(
        EARNINGS_CONFIG_ENDPOINTS.BY_FRANCHISE(franchiseId),
        data
    );
    return response.data;
}

/**
 * Get earnings config for a driver
 */
export async function getEarningsConfigByDriver(
    driverId: string
): Promise<{ data: EarningsConfigResponse }> {
    const response = await api.get<{ data: EarningsConfigResponse }>(
        EARNINGS_CONFIG_ENDPOINTS.BY_DRIVER(driverId)
    );
    return response.data;
}

/**
 * Set earnings config for one or more drivers
 */
export async function setDriverEarningsConfig(
    driverIds: string[],
    data: UpdateEarningsConfigRequest
): Promise<{ data: EarningsConfigResponse[] }> {
    const response = await api.post<{ data: EarningsConfigResponse[] }>(
        EARNINGS_CONFIG_ENDPOINTS.BY_DRIVERS,
        { driverIds, ...data }
    );
    return response.data;
}

/**
 * Get earnings configs for multiple franchises
 */
export async function getEarningsConfigsByFranchises(
    franchiseIds: string[]
): Promise<{ data: EarningsConfigResponse[] }> {
    const queryParams = new URLSearchParams();
    queryParams.append('franchiseIds', franchiseIds.join(','));
    const response = await api.get<{ data: EarningsConfigResponse[] }>(
        `${EARNINGS_CONFIG_ENDPOINTS.BY_FRANCHISES}?${queryParams.toString()}`
    );
    return response.data;
}
