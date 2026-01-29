/**
 * Trip API Module
 * 
 * All API calls use the axios instance with interceptors configured in '../../axios'
 */
import api from '../../axios';

// API Endpoints
export const TRIP_ENDPOINTS = {
    BASE: '/trips',
    PHASE1: '/trips/phase1',
    BY_ID: (id: string | number) => `/trips/${id}`,
    /** POST /trips/:id/assign-driver - Assign a driver to a trip */
    ASSIGN_DRIVER: (tripId: string) => `/trips/${tripId}/assign-driver`,
} as const;

// Request DTOs (matching backend)
export interface CreateTripPhase1Request {
    // Customer data
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    
    // Location data
    pickupLocation: string;
    pickupAddress: string;
    pickupLocationNote?: string;
    
    destinationLocation: string;
    destinationAddress: string;
    destinationNote?: string;
    
    // Trip details
    franchiseId: string;
    tripType: string;
    distance?: number;
    distanceScope?: string;
    
    // Car preferences
    carGearType: string; // MANUAL | AUTOMATIC
    carType: string; // PREMIUM | LUXURY | NORMAL
    
    // Schedule
    tripDate: string; // ISO date string
    tripTime: string; // Time string (HH:mm format)
    
    // Flags
    isDetailsReconfirmed: boolean;
    isFareDiscussed: boolean;
    isPriceAccepted: boolean;
}

// Response DTOs (matching backend)
export interface CreateTripPhase1Response {
    data: {
        trip: any;
        customer: {
            id: number;
            name: string;
            phone: string;
            email: string | null;
            isExisting: boolean;
        };
        pricing: {
            calculated: boolean;
            breakdown?: any;
            configUsed?: any;
            message?: string;
        };
    };
}

export interface TripResponse {
    id: string; // UUID
    franchiseId: string;
    driverId: string | null;
    customerId: number | null;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    tripType: string;
    status: string;
    pickupLocation: string;
    pickupAddress?: string | null;
    pickupLocationNote?: string | null;
    dropLocation: string | null;
    dropAddress?: string | null;
    dropLocationNote?: string | null;
    carType?: string | null;
    scheduledAt: Date | string | null;
    startedAt: Date | string | null;
    endedAt: Date | string | null;
    baseAmount: number;
    extraAmount: number;
    totalAmount: number;
    finalAmount: number;
    paymentStatus: string;
    paymentMode?: string | null;
    paymentReference?: string | null;
    isAmountOverridden?: boolean;
    overrideReason?: string | null;
    isDetailsReconfirmed?: boolean;
    isFareDiscussed?: boolean;
    isPriceAccepted?: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    Franchise?: {
        id: string;
        code: string;
        name: string;
        location?: string;
    } | null;
    Driver?: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        driverCode: string;
    } | null;
    Customer?: {
        id: number;
        fullName: string;
        phone: string;
        email?: string | null;
    } | null;
}

export interface TripListResponse {
    data: TripResponse[];
}

export interface TripFilters {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    statuses?: string[];
    franchiseId?: string;
}

export interface TripsPaginatedResponse {
    data: TripResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

/**
 * Get list of all trips (no pagination)
 */
export async function getTripList(): Promise<TripResponse[]> {
    const response = await api.get<TripListResponse>(TRIP_ENDPOINTS.BASE);
    return response.data.data;
}

/**
 * Get trips with pagination and optional filters
 */
export async function getTripsPaginated(params: {
    page?: number;
    limit?: number;
} & TripFilters): Promise<TripsPaginatedResponse> {
    const { page = 1, limit = 10, dateFrom, dateTo, status, statuses, franchiseId } = params;
    const search = new URLSearchParams();
    search.set('page', String(page));
    search.set('limit', String(limit));
    if (dateFrom) search.set('dateFrom', dateFrom);
    if (dateTo) search.set('dateTo', dateTo);
    if (status) search.set('status', status);
    if (statuses?.length) search.set('statuses', statuses.join(','));
    if (franchiseId) search.set('franchiseId', franchiseId);
    const url = `${TRIP_ENDPOINTS.BASE}?${search.toString()}`;
    const response = await api.get<TripsPaginatedResponse>(url);
    return response.data;
}

/**
 * Get trip count for a given filter (for KPIs). Uses page=1, limit=1 and returns pagination.total.
 */
export async function getTripCount(filters: TripFilters): Promise<number> {
    const res = await getTripsPaginated({ page: 1, limit: 1, ...filters });
    return res.pagination.total;
}

/**
 * Get trip details by ID
 */
export async function getTripById(id: string): Promise<TripResponse> {
    const response = await api.get<{ data: TripResponse }>(TRIP_ENDPOINTS.BY_ID(id));
    return response.data.data;
}

/**
 * Get unassigned trips
 */
export async function getUnassignedTrips(): Promise<TripResponse[]> {
    const response = await api.get<{ data: TripResponse[] }>('/trips/unassigned');
    return response.data.data;
}

/**
 * Get available drivers for a trip (sorted by performance)
 */
export async function getAvailableDriversForTrip(tripId: string): Promise<any[]> {
    const response = await api.get<{ data: any[] }>(`/trips/${tripId}/available-drivers`);
    return response.data.data;
}

/**
 * Assign driver to trip (POST /trips/:id/assign-driver).
 * Uses the trips API to assign the given driver to the trip.
 */
export async function assignDriverToTrip(tripId: string, driverId: string): Promise<TripResponse> {
    const response = await api.post<{ data: TripResponse }>(
        TRIP_ENDPOINTS.ASSIGN_DRIVER(tripId),
        { driverId }
    );
    return response.data.data;
}

/**
 * Create a trip phase 1 (initial booking)
 */
export async function createTripPhase1(data: CreateTripPhase1Request): Promise<CreateTripPhase1Response> {
    const response = await api.post<CreateTripPhase1Response>(TRIP_ENDPOINTS.PHASE1, data);
    return response.data;
}

/**
 * Reschedule a trip
 */
export async function rescheduleTrip(tripId: string, payload: { tripDate: string; tripTime: string }): Promise<TripResponse> {
    const response = await api.patch<{ data: TripResponse }>(`/trips/${tripId}/reschedule`, payload);
    return response.data.data;
}

/**
 * Cancel a trip
 */
export async function cancelTrip(tripId: string, payload: { cancelledBy: 'OFFICE' | 'CUSTOMER'; reason?: string | null }): Promise<TripResponse> {
    const response = await api.patch<{ data: TripResponse }>(`/trips/${tripId}/cancel`, payload);
    return response.data.data;
}

/**
 * Reassign driver to a trip
 */
export async function reassignDriverToTrip(tripId: string, payload: { driverId: string; franchiseId?: string }): Promise<TripResponse> {
    const response = await api.patch<{ data: TripResponse }>(`/trips/${tripId}/reassign-driver`, payload);
    return response.data.data;
}

/**
 * Activity log entry for trip timeline
 */
export interface TripActivityLog {
    id: string;
    action: string;
    entityType: string;
    description: string;
    metadata: any;
    createdAt: Date | string;
    user?: {
        id: string;
        fullName: string;
        email: string;
        role: string;
    } | null;
    driver?: {
        id: string;
        firstName: string;
        lastName: string;
        driverCode: string;
    } | null;
    staff?: {
        id: string;
        name: string;
        email: string;
    } | null;
}

/**
 * Get activity logs for a specific trip
 */
export async function getTripLogs(tripId: string): Promise<TripActivityLog[]> {
    const response = await api.get<{ data: TripActivityLog[] }>(`/trips/${tripId}/logs`);
    return response.data.data;
}
