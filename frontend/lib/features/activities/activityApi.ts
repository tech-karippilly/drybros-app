/**
 * Activity API Module
 * GET /activities, GET /activities/stream
 */
import api from '../../axios';

const ACTIVITY_ENDPOINTS = {
  BASE: '/activities',
  STREAM: '/activities/stream',
} as const;

export interface ActivityLogResponse {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  franchiseId: string | null;
  driverId: string | null;
  staffId: string | null;
  tripId: string | null;
  userId: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: { id: string; fullName: string; email: string; role: string } | null;
  franchise?: { id: string; name: string; code: string } | null;
  driver?: { id: string; firstName: string; lastName: string; driverCode: string } | null;
  staff?: { id: string; name: string; email: string } | null;
  trip?: { id: string; customerName: string; status: string } | null;
}

export interface PaginatedActivitiesResponse {
  data: ActivityLogResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ActivitiesListResponse {
  data: ActivityLogResponse[];
}

export type GetActivitiesResponse = PaginatedActivitiesResponse | ActivitiesListResponse;

function isPaginated(
  r: GetActivitiesResponse
): r is PaginatedActivitiesResponse {
  return 'pagination' in r && typeof (r as PaginatedActivitiesResponse).pagination === 'object';
}

/**
 * Get activity logs. Use page/limit for paginated recent feed.
 */
export async function getActivities(params?: {
  page?: number;
  limit?: number;
  franchiseId?: string;
}): Promise<ActivityLogResponse[]> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.franchiseId) search.set('franchiseId', params.franchiseId);
  const qs = search.toString();
  const url = qs ? `${ACTIVITY_ENDPOINTS.BASE}?${qs}` : ACTIVITY_ENDPOINTS.BASE;
  const response = await api.get<GetActivitiesResponse>(url);
  const res = response.data;
  if (isPaginated(res)) return res.data;
  return res.data;
}
