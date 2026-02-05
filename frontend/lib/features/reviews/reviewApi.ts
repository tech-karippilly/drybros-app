import api from '../../axios';

export interface CreateTripReviewRequest {
  tripId: string;
  driverId: string;
  franchiseId: string;
  customerId: string;
  tripRating: number;
  driverRating: number;
  overallRating: number;
  comment: string;
}

export interface TripReviewResponse {
  id: string;
  tripId: string;
  driverId: string;
  franchiseId: string;
  customerId: string;
  tripRating: number;
  driverRating: number;
  overallRating: number;
  comment: string;
  createdAt: string;
}

export async function submitTripReviewPublic(body: CreateTripReviewRequest): Promise<TripReviewResponse> {
  const res = await api.post<{ message: string; data: TripReviewResponse }>('/reviews/public', body);
  return res.data.data;
}
