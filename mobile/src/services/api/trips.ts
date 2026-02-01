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

export async function getMyAssignedTripsApi(): Promise<BackendTrip[]> {
  const res = await apiClient.get<ListMyAssignedTripsResponse>(API_ENDPOINTS.TRIPS.MY_ASSIGNED);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as BackendTrip[];
}

export async function getTripByIdApi(tripId: string): Promise<BackendTrip> {
  const url = replacePathParam(API_ENDPOINTS.TRIPS.DETAILS, tripId);
  const res = await apiClient.get<TripDetailsResponse>(url);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as BackendTrip;
}

