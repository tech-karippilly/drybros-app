/**
 * Ratings API – GET/POST /ratings
 */
import api from '../../axios';

export interface RatingResponse {
  id: string;
  driverId: string;
  tripId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  overallRating: number;
  experience: string | null;
  drivingSafety: number;
  drivingSmoothness: number;
  behaviorPoliteness: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRatingRequest {
  driverId: string;
  tripId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  overallRating: number;
  experience?: string | null;
  drivingSafety: number;
  drivingSmoothness: number;
  behaviorPoliteness: number;
}

export interface PaginatedRatingsResponse {
  data: RatingResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

export async function getRatings(params?: {
  page?: number;
  limit?: number;
  driverId?: string;
  tripId?: string;
}): Promise<RatingResponse[] | PaginatedRatingsResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.driverId) search.set('driverId', params.driverId);
  if (params?.tripId) search.set('tripId', params.tripId);
  const url = search.toString() ? `/ratings?${search.toString()}` : '/ratings';
  const res = await api.get<{ data: RatingResponse[] } | PaginatedRatingsResponse>(url);
  const d = res.data;
  if ('pagination' in d) return d as PaginatedRatingsResponse;
  return (d as { data: RatingResponse[] }).data;
}

export async function getRatingById(id: string): Promise<RatingResponse> {
  const res = await api.get<{ data: RatingResponse }>(`/ratings/${id}`);
  return res.data.data;
}

export async function createRating(body: CreateRatingRequest): Promise<RatingResponse> {
  const res = await api.post<{ data: RatingResponse }>('/ratings', body);
  return res.data.data;
}
