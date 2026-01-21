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
} as const;

// Request DTOs (matching backend)
export interface CreateFranchiseRequest {
    name: string;
    region: string;
    address: string;
    phone: string;
    inchargeName: string;
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
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface FranchiseListResponse {
    data: FranchiseResponse[];
}

export interface FranchiseDetailResponse {
    data: FranchiseResponse;
}

export interface CreateFranchiseResponse {
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
 * Get franchise by ID
 */
export async function getFranchiseById(id: string): Promise<FranchiseResponse> {
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
