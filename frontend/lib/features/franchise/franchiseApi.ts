/**
 * Franchise API Module
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
const FRANCHISE_ENDPOINTS = {
    BASE: '/franchises',
    BY_ID: (id: string) => `/franchises/${id}`,
    PERSONNEL: (id: string) => `/franchises/${id}/personnel`,
    STATUS: (id: string) => `/franchises/${id}/status`,
    PERFORMANCE: (id: string) => `/franchises/${id}/performance`,
} as const;

/** Franchise status values (must match backend enum) */
export const FRANCHISE_STATUS = {
    ACTIVE: 'ACTIVE',
    BLOCKED: 'BLOCKED',
    TEMPORARILY_CLOSED: 'TEMPORARILY_CLOSED',
} as const;
export type FranchiseStatus = (typeof FRANCHISE_STATUS)[keyof typeof FRANCHISE_STATUS];

// Request DTOs (matching backend)
export interface CreateFranchiseRequest {
    name: string;
    region: string;
    address: string;
    phone: string;
    franchiseEmail: string;
    managerName: string;
    managerEmail: string;
    managerPhone: string;
    storeImage?: string | null;
    legalDocumentsCollected?: boolean;
}

// Response DTOs (matching backend)
export interface FranchiseResponse {
    id: string;
    code: string;
    name: string;
    city: string;
    region: string | null;
    address: string | null;
    phone: string | null;
    inchargeName: string | null;
    storeImage: string | null;
    legalDocumentsCollected: boolean;
    status?: string;
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface FranchiseListResponse {
    data: FranchiseResponse[];
}

/** Statistics returned with franchise detail (GET /franchises/:id) */
export interface FranchiseStatistics {
    totalStaff: number;
    totalDrivers: number;
    totalTrips: number;
    totalComplaints: number;
    totalRevenue: number;
}

/** Staff member in franchise detail response */
export interface FranchiseDetailStaff {
    id: string;
    name: string;
    phone: string;
    email: string;
    joinDate: string;
    status: string;
    isActive: boolean;
}

/** Driver in franchise detail response */
export interface FranchiseDetailDriver {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    driverCode: string;
    status: string;
    currentRating: number;
    isActive: boolean;
}

/** Full franchise detail (GET /franchises/:id) */
export interface FranchiseDetailData extends FranchiseResponse {
    statistics: FranchiseStatistics;
    staff: FranchiseDetailStaff[];
    drivers: FranchiseDetailDriver[];
}

export interface FranchiseDetailResponse {
    data: FranchiseDetailData;
}

export interface CreateFranchiseResponse {
    message: string;
    data: FranchiseResponse;
}

/** Update franchise request (PUT /franchises/:id) - all fields optional */
export interface UpdateFranchiseRequest {
    name?: string;
    region?: string;
    address?: string;
    phone?: string;
    managerName?: string;
    franchiseEmail?: string;
    storeImage?: string | null;
    legalDocumentsCollected?: boolean;
}

export interface UpdateFranchiseResponse {
    message: string;
    data: FranchiseResponse;
}

/**
 * Get list of franchises
 */
export async function getFranchiseList(): Promise<FranchiseResponse[]> {
    const response = await api.get<FranchiseListResponse>(FRANCHISE_ENDPOINTS.BASE);
    return response.data.data;
}

/**
 * Get franchise by ID (full detail: statistics, staff, drivers)
 */
export async function getFranchiseById(id: string): Promise<FranchiseDetailData> {
    const response = await api.get<FranchiseDetailResponse>(FRANCHISE_ENDPOINTS.BY_ID(id));
    return response.data.data;
}

/**
 * Get franchise by code (searches through list)
 * Note: Backend doesn't have a direct endpoint for this, so we fetch all and filter
 */
export async function getFranchiseByCode(code: string): Promise<FranchiseResponse | null> {
    const franchises = await getFranchiseList();
    return franchises.find(f => f.code === code) || null;
}

/**
 * Create a new franchise
 */
export async function createFranchise(data: CreateFranchiseRequest): Promise<CreateFranchiseResponse> {
    const response = await api.post<CreateFranchiseResponse>(FRANCHISE_ENDPOINTS.BASE, data);
    return response.data;
}

/**
 * Update franchise (PUT /franchises/:id)
 */
export async function updateFranchise(id: string, data: UpdateFranchiseRequest): Promise<UpdateFranchiseResponse> {
    const response = await api.put<UpdateFranchiseResponse>(FRANCHISE_ENDPOINTS.BY_ID(id), data);
    return response.data;
}

// Personnel Response DTOs
export interface PersonnelBasicInfo {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
}

export interface FranchisePersonnelResponse {
    data: {
        staff: PersonnelBasicInfo[];
        drivers: PersonnelBasicInfo[];
        manager: PersonnelBasicInfo | null;
    };
}

/**
 * Get franchise personnel (staff, drivers, and manager)
 */
export async function getFranchisePersonnel(franchiseId: string): Promise<FranchisePersonnelResponse['data']> {
    const response = await api.get<FranchisePersonnelResponse>(FRANCHISE_ENDPOINTS.PERSONNEL(franchiseId));
    return response.data.data;
}

export interface UpdateFranchiseStatusRequest {
    status: FranchiseStatus;
}

export interface UpdateFranchiseStatusResponse {
    message: string;
    data: FranchiseResponse;
}

/**
 * Update franchise status (ACTIVE, BLOCKED, TEMPORARILY_CLOSED)
 */
export async function updateFranchiseStatus(
    id: string,
    body: UpdateFranchiseStatusRequest
): Promise<UpdateFranchiseStatusResponse> {
    const response = await api.patch<UpdateFranchiseStatusResponse>(FRANCHISE_ENDPOINTS.STATUS(id), body);
    return response.data;
}

export interface DeleteFranchiseResponse {
    message: string;
}

/**
 * Soft delete a franchise (ADMIN only)
 */
export async function deleteFranchise(id: string): Promise<DeleteFranchiseResponse> {
    const response = await api.delete<DeleteFranchiseResponse>(FRANCHISE_ENDPOINTS.BY_ID(id));
    return response.data;
}

// Franchise Performance DTOs
export interface FranchisePerformanceMetrics {
    franchiseId: string;
    totalTrips: number;
    totalReviews: number;
    activeCustomersCount: number;
}

export interface FranchisePerformanceResponse {
    data: FranchisePerformanceMetrics;
}

/**
 * Get franchise performance metrics (ADMIN only)
 */
export async function getFranchisePerformance(franchiseId: string): Promise<FranchisePerformanceMetrics> {
    const response = await api.get<FranchisePerformanceResponse>(FRANCHISE_ENDPOINTS.PERFORMANCE(franchiseId));
    return response.data.data;
}

