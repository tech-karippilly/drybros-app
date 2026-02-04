import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/endpints';

export type BackendTripOfferStatus = 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export type BackendTripOffer = {
  id: string;
  tripId: string;
  driverId: string;
  status: BackendTripOfferStatus;
  offeredAt?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  expiresAt: string;
};

export type AcceptTripOfferResponse = {
  data: BackendTripOffer;
};

function replacePathParam(pathTemplate: string, param: string): string {
  return pathTemplate.replace(':id', encodeURIComponent(param));
}

export async function acceptTripOfferApi(offerId: string): Promise<BackendTripOffer> {
  const url = replacePathParam(API_ENDPOINTS.TRIP_OFFERS.ACCEPT, offerId);
  const res = await apiClient.post<AcceptTripOfferResponse>(url);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as BackendTripOffer;
}

export type RejectTripOfferResponse = {
  data: BackendTripOffer;
};

export async function rejectTripOfferApi(offerId: string): Promise<BackendTripOffer> {
  const url = replacePathParam(API_ENDPOINTS.TRIP_OFFERS.REJECT, offerId);
  const res = await apiClient.post<RejectTripOfferResponse>(url);
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as BackendTripOffer;
}

