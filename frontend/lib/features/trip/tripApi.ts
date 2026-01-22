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

/**
 * Get list of all trips
 */
export async function getTripList(): Promise<TripResponse[]> {
    const response = await api.get<TripListResponse>(TRIP_ENDPOINTS.BASE);
    return response.data.data;
}

/**
 * Get trip details by ID
 */
export async function getTripById(id: string): Promise<TripResponse> {
    const response = await api.get<{ data: TripResponse }>(TRIP_ENDPOINTS.BY_ID(id));
    return response.data.data;
}

/**
 * Create a trip phase 1 (initial booking)
 */
export async function createTripPhase1(data: CreateTripPhase1Request): Promise<CreateTripPhase1Response> {
    const response = await api.post<CreateTripPhase1Response>(TRIP_ENDPOINTS.PHASE1, data);
    return response.data;
}
