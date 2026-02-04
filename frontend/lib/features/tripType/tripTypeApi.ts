/**
 * Trip Type API Module
 * 
 * All API calls use the axios instance with interceptors configured in '../../axios'
 */
import api from '../../axios';

// API Endpoints
export const TRIP_TYPE_ENDPOINTS = {
    BASE: '/trip-types',
    BY_ID: (id: string) => `/trip-types/${id}`,
} as const;

// Request DTOs (matching backend)
export interface CreateTripTypeRequest {
    name: string;
    specialPrice?: boolean;
    basePrice?: number;
    baseHour?: number;
    baseDuration?: number;
    distance?: number;
    extraPerHour?: number;
    extraPerHalfHour?: number;
    description?: string;
    distanceSlabs?: any[];
}

export interface UpdateTripTypeRequest {
    name?: string;
    specialPrice?: boolean;
    basePrice?: number;
    baseHour?: number;
    baseDuration?: number;
    distance?: number;
    extraPerHour?: number;
    extraPerHalfHour?: number;
    description?: string;
    distanceSlabs?: any[];
}

// Response DTOs (matching backend)
export interface TripTypeResponse {
    id: string;
    name: string;
    description?: string | null;
    specialPrice?: boolean;
    basePrice?: number | null;
    basePricePerHour?: number | null;
    baseDuration?: number | null;
    baseHour?: number | null;
    baseDistance?: number | null;
    distance?: number | null;
    extraPerHour?: number | null;
    extraPerHalfHour?: number | null;
    extraPerKm?: number | null;
    premiumCarMultiplier?: number | null;
    forPremiumCars?: any | null;
    distanceSlabs?: any | null;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface TripTypeListResponse {
    data: TripTypeResponse[];
}

export interface TripTypePaginatedResponse {
    data: TripTypeResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface TripTypeDetailResponse {
    data: TripTypeResponse;
}

export interface CreateTripTypeResponse {
    data: TripTypeResponse;
}

/**
 * Get list of trip types (all)
 */
export async function getTripTypeList(): Promise<TripTypeResponse[]> {
    const response = await api.get<TripTypeListResponse>(TRIP_TYPE_ENDPOINTS.BASE);
    return response.data.data;
}

/**
 * Get paginated list of trip types
 */
export async function getTripTypeListPaginated(
    page: number = 1,
    limit: number = 10
): Promise<TripTypePaginatedResponse> {
    const response = await api.get<TripTypePaginatedResponse>(
        TRIP_TYPE_ENDPOINTS.BASE,
        { params: { page, limit } }
    );
    return response.data;
}

/**
 * Get trip type by ID
 */
export async function getTripTypeById(id: string): Promise<TripTypeResponse> {
    const response = await api.get<TripTypeDetailResponse>(TRIP_TYPE_ENDPOINTS.BY_ID(id));
    return response.data.data;
}

/**
 * Create a new trip type
 */
export async function createTripType(data: CreateTripTypeRequest): Promise<CreateTripTypeResponse> {
    const response = await api.post<CreateTripTypeResponse>(TRIP_TYPE_ENDPOINTS.BASE, data);
    return response.data;
}

/**
 * Update a trip type
 */
export async function updateTripType(
    id: string,
    data: UpdateTripTypeRequest
): Promise<CreateTripTypeResponse> {
    const response = await api.put<CreateTripTypeResponse>(TRIP_TYPE_ENDPOINTS.BY_ID(id), data);
    return response.data;
}

/**
 * Delete a trip type (soft delete)
 */
export async function deleteTripType(id: string): Promise<void> {
    await api.delete(TRIP_TYPE_ENDPOINTS.BY_ID(id));
}
