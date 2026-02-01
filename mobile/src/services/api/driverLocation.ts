import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/endpints';

export type UpdateDriverLocationRequest = {
  lat: number;
  lng: number;
  accuracyM?: number;
  capturedAt?: string; // ISO string
};

export type UpdateDriverLocationResponse = {
  data?: unknown;
};

export async function updateMyDriverLocationApi(
  payload: UpdateDriverLocationRequest
): Promise<UpdateDriverLocationResponse> {
  const res = await apiClient.post<UpdateDriverLocationResponse>(
    API_ENDPOINTS.DRIVER.ME_LOCATION,
    payload
  );
  return res.data;
}

