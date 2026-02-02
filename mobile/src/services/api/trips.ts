import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/endpints';

export type BackendTrip = {
  id: string;
  customerName?: string | null;
  customerPhone?: string | null;
  pickupAddress?: string | null;
  dropAddress?: string | null;
  pickupLocation?: string | null;
  dropLocation?: string | null;
  tripType?: string | null;
  status?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  totalAmount?: number | null;
  finalAmount?: number | null;
  paymentStatus?: string | null;
  paymentMode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ListMyAssignedTripsResponse = {
  data: BackendTrip[];
};

export type TripDetailsResponse = {
  data: BackendTrip;
};

function replacePathParam(pathTemplate: string, param: string): string {
  return pathTemplate.replace(':id', encodeURIComponent(param));
}

export type TripStartInitiatePayload = {
  odometerValue: number;
  odometerPic: string;
  carFrontPic: string;
  carBackPic: string;
};

export type TripStartInitiateResponse = {
  data: {
    token: string;
    tripId: string;
    message?: string;
    emailSent?: boolean;
  };
};

export type TripStartVerifyPayload = {
  token: string;
  otp: string;
};

export type TripStartVerifyResponse = {
  data: BackendTrip;
};

export type TripEndInitiatePayload = {
  odometerValue: number;
  odometerImage: string;
};

export type TripEndInitiateResponse = {
  data: {
    token: string;
    tripId: string;
    message?: string;
    emailSent?: boolean;
  };
};

export type TripEndVerifyPayload = {
  token: string;
  otp: string;
};

export type TripEndVerifyResponse = {
  data: {
    totalAmount: number;
    distanceTraveled: number;
    timeTakenHours: number;
    timeTakenMinutes: number;
    tripType: string;
    calculatedAmount: number;
  };
};

export const PAYMENT_METHODS = {
  UPI: 'UPI',
  CASH: 'CASH',
  BOTH: 'BOTH',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export type CollectPaymentPayload = {
  driverId: string;
  paymentMethod: PaymentMethod;
  upiAmount?: number;
  cashAmount?: number;
  upiReference?: string;
};

export type CollectPaymentResponse = {
  data: {
    tripId: string;
    paymentMethod: PaymentMethod;
    totalPaid: number;
    upiAmount: number | null;
    cashAmount: number | null;
    paymentStatus: string;
    message?: string;
  };
};

export type VerifyPaymentPayload = {
  driverId: string;
};

export type VerifyPaymentResponse = {
  data: {
    tripId: string;
    status: string;
    message?: string;
    emailSent?: boolean;
  };
};

export async function getMyAssignedTripsApi(): Promise<BackendTrip[]> {
  const res = await apiClient.get<ListMyAssignedTripsResponse>(API_ENDPOINTS.TRIPS.MY_ASSIGNED);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as BackendTrip[];
}

/**
 * Trips tab / history list.
 * Returns all trips for the logged-in driver (includes completed/cancelled).
 */
export async function getMyTripsApi(): Promise<BackendTrip[]> {
  const res = await apiClient.get<ListMyAssignedTripsResponse>(API_ENDPOINTS.TRIPS.MY);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as BackendTrip[];
}

export async function getTripByIdApi(tripId: string): Promise<BackendTrip> {
  const url = replacePathParam(API_ENDPOINTS.TRIPS.DETAILS, tripId);
  const res = await apiClient.get<TripDetailsResponse>(url);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as BackendTrip;
}

export async function startTripInitiateApi(tripId: string, body: TripStartInitiatePayload): Promise<TripStartInitiateResponse['data']> {
  const url = replacePathParam(API_ENDPOINTS.TRIPS.START_INITIATE, tripId);
  const res = await apiClient.post<TripStartInitiateResponse>(url, body);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as TripStartInitiateResponse['data'];
}

export async function startTripVerifyApi(tripId: string, body: TripStartVerifyPayload): Promise<BackendTrip> {
  const url = replacePathParam(API_ENDPOINTS.TRIPS.START_VERIFY, tripId);
  const res = await apiClient.post<TripStartVerifyResponse>(url, body);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as BackendTrip;
}

export async function endTripInitiateApi(tripId: string, body: TripEndInitiatePayload): Promise<TripEndInitiateResponse['data']> {
  const url = replacePathParam(API_ENDPOINTS.TRIPS.END_INITIATE, tripId);
  const res = await apiClient.post<TripEndInitiateResponse>(url, body);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as TripEndInitiateResponse['data'];
}

export async function endTripVerifyApi(tripId: string, body: TripEndVerifyPayload): Promise<TripEndVerifyResponse['data']> {
  const url = replacePathParam(API_ENDPOINTS.TRIPS.END_VERIFY, tripId);
  const res = await apiClient.post<TripEndVerifyResponse>(url, body);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as TripEndVerifyResponse['data'];
}

export async function collectPaymentApi(tripId: string, body: CollectPaymentPayload): Promise<CollectPaymentResponse['data']> {
  const url = replacePathParam(API_ENDPOINTS.TRIPS.COLLECT_PAYMENT, tripId);
  const res = await apiClient.post<CollectPaymentResponse>(url, body);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as CollectPaymentResponse['data'];
}

export async function verifyPaymentApi(tripId: string, body: VerifyPaymentPayload): Promise<VerifyPaymentResponse['data']> {
  const url = replacePathParam(API_ENDPOINTS.TRIPS.VERIFY_PAYMENT, tripId);
  const res = await apiClient.post<VerifyPaymentResponse>(url, body);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as VerifyPaymentResponse['data'];
}

