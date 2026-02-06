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
    TIME_BASED = 'TIME_BASED',
    DISTANCE_BASED = 'DISTANCE_BASED',
}

export enum CarType {
    MANUAL = 'MANUAL',
    AUTOMATIC = 'AUTOMATIC',
    PREMIUM_CARS = 'PREMIUM_CARS',
    LUXURY_CARS = 'LUXURY_CARS',
    SPORTY_CARS = 'SPORTY_CARS',
}

// Car type display metadata
export const CAR_TYPE_METADATA: Record<CarType, { label: string; icon: string; color: string }> = {
    [CarType.MANUAL]: { label: 'Manual', icon: '⚙️', color: 'bg-blue-500' },
    [CarType.AUTOMATIC]: { label: 'Automatic', icon: '🚗', color: 'bg-green-500' },
    [CarType.PREMIUM_CARS]: { label: 'Premium Cars', icon: '✨', color: 'bg-purple-500' },
    [CarType.LUXURY_CARS]: { label: 'Luxury Cars', icon: '👑', color: 'bg-amber-500' },
    [CarType.SPORTY_CARS]: { label: 'Sporty Cars', icon: '🏎️', color: 'bg-red-500' },
};

// Distance slab for DISTANCE_BASED pricing
export interface DistanceSlab {
    from: number; // Starting distance in km
    to: number | null; // Ending distance in km (null for open-ended)
    price: number; // Price for this distance range
}

// Car type pricing configuration
export interface CarTypePricing {
    id?: string;
    carType: CarType;
    basePrice: number;
    distanceSlabs?: DistanceSlab[] | null;
}

// Request DTOs (matching new backend structure)
export interface CreateTripTypeRequest {
    name: string;
    description?: string;
    pricingMode: PricingMode;
    
    // Common fields for both modes
    baseHour?: number; // Base hours included
    extraPerHour?: number; // Extra per hour
    extraPerHalfHour?: number; // Extra per 30 min
    
    // Distance-based mode specific
    baseDistance?: number; // Base distance in km
    
    // Car type pricing (required for all car types)
    carTypePricing: Omit<CarTypePricing, 'id'>[];
}

export interface UpdateTripTypeRequest {
    name?: string;
    description?: string;
    pricingMode?: PricingMode;
    baseHour?: number;
    extraPerHour?: number;
    extraPerHalfHour?: number;
    baseDistance?: number;
    carTypePricing?: Omit<CarTypePricing, 'id'>[];
}

// Response DTOs (matching new backend structure)
export interface TripTypeResponse {
    id: string;
    name: string;
    description?: string | null;
    pricingMode: PricingMode;
    baseHour?: number | null;
    extraPerHour?: number | null;
    extraPerHalfHour?: number | null;
    baseDistance?: number | null;
    carTypePricing: CarTypePricing[];
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
