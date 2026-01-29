/**
 * Attendance API – GET /attendance, POST /attendance/clock-in, POST /attendance/clock-out
 */
import api from '../../axios';

export interface AttendanceResponse {
  id: string;
  driverId: string | null;
  staffId: string | null;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Request body for clock-in. Backend expects `id` (driver, staff, or user UUID). */
export interface ClockInRequest {
  id: string;
  notes?: string | null;
}

/** Request body for clock-out. Backend expects `id` (driver, staff, or user UUID). */
export interface ClockOutRequest {
  id: string;
  notes?: string | null;
}

export interface PaginatedAttendanceResponse {
  data: AttendanceResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

export async function getAttendances(params?: {
  page?: number;
  limit?: number;
  driverId?: string;
  staffId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceResponse[] | PaginatedAttendanceResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.driverId) search.set('driverId', params.driverId);
  if (params?.staffId) search.set('staffId', params.staffId);
  if (params?.userId) search.set('userId', params.userId);
  if (params?.startDate) search.set('startDate', params.startDate);
  if (params?.endDate) search.set('endDate', params.endDate);
  const url = search.toString() ? `/attendance?${search.toString()}` : '/attendance';
  const res = await api.get<{ data: AttendanceResponse[] } | PaginatedAttendanceResponse>(url);
  const d = res.data;
  if ('pagination' in d) return d as PaginatedAttendanceResponse;
  return (d as { data: AttendanceResponse[] }).data;
}

export async function getAttendanceById(id: string): Promise<AttendanceResponse> {
  const res = await api.get<{ data: AttendanceResponse }>(`/attendance/${id}`);
  return res.data.data;
}

export async function clockIn(body: ClockInRequest): Promise<AttendanceResponse> {
  const res = await api.post<{ data: AttendanceResponse }>('/attendance/clock-in', body);
  return res.data.data;
}

export async function clockOut(body: ClockOutRequest): Promise<AttendanceResponse> {
  const res = await api.post<{ data: AttendanceResponse }>('/attendance/clock-out', body);
  return res.data.data;
}
