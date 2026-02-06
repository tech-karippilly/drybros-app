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

// Enums matching backend
export enum PricingMode {
    TIME = 'TIME',
    DISTANCE = 'DISTANCE',
    SLAB = 'SLAB',
}

export enum CarType {
    NORMAL = 'NORMAL',
    PREMIUM = 'PREMIUM',
    LUXURY = 'LUXURY',
    SPORTS = 'SPORTS',
}

// Car type display metadata
export const CAR_TYPE_METADATA: Record<CarType, { label: string; icon: string; color: string }> = {
    [CarType.NORMAL]: { label: 'Normal', icon: '🚗', color: 'bg-blue-500' },
    [CarType.PREMIUM]: { label: 'Premium', icon: '✨', color: 'bg-purple-500' },
    [CarType.LUXURY]: { label: 'Luxury', icon: '👑', color: 'bg-amber-500' },
    [CarType.SPORTS]: { label: 'Sports', icon: '🏎️', color: 'bg-red-500' },
};

// Distance slab for DISTANCE_BASED pricing
export interface DistanceSlab {
    from: number; // Starting distance in km
    to: number | null; // Ending distance in km (null for open-ended)
    price: number; // Price for this distance range
}

// Time slab for TIME_BASED slab pricing
export interface TimeSlab {
    from: string; // Starting time (e.g., "00:00", "06:00")
    to: string; // Ending time (e.g., "06:00", "12:00")
    price: number; // Price for this time range
}

// Request DTOs (matching backend structure)
export interface CreateTripTypeRequest {
    carCategory: CarType; // NORMAL, PREMIUM, LUXURY, SPORTS
    type: PricingMode; // TIME, DISTANCE, or SLAB
    
    // For TIME type
    baseAmount?: number; // base price
    baseHour?: number;
    extraPerHour?: number;
    extraPerHalfHour?: number;
    
    // For DISTANCE type
    baseDistance?: number; // in km
    extraPerDistance?: number; // per km
    
    // For SLAB type
    slabType?: "distance" | "time"; // Required when type is SLAB
    distanceSlab?: DistanceSlab[]; // Array of {from, to, price} - for SLAB with distance
    timeSlab?: TimeSlab[]; // Array of {from, to, price} - for SLAB with time
}

export interface UpdateTripTypeRequest {
    baseAmount?: number;
    baseHour?: number;
    baseDistance?: number;
    extraPerHour?: number;
    extraPerHalfHour?: number;
    extraPerDistance?: number;
    distanceSlab?: DistanceSlab[];
    timeSlab?: TimeSlab[];
}

// Response DTOs (matching backend structure)
export interface TripTypeResponse {
    id: string;
    type: PricingMode; // TIME, DISTANCE, or SLAB
    carCategory: CarType; // NORMAL, PREMIUM, LUXURY, SPORTS
    
    baseAmount?: number | null;
    baseHour?: number | null;
    baseDistance?: number | null;
    extraPerHour?: number | null;
    extraPerHalfHour?: number | null;
    extraPerDistance?: number | null;
    
    distanceSlab?: DistanceSlab[] | null;
    timeSlab?: TimeSlab[] | null;
    
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
