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
  sessions: AttendanceSession[];
  totalWorkHours?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStatus{ 
  "clockedIn": boolean,
  "clockInTime": string,
  "lastClockOutTime": string | null,
  "status": string,
  "attendanceId": string
}

/** Request body for clock-in. Backend expects `id` (driver, staff, or user UUID). */
export interface ClockInRequest {
  id?: string;
  driverId?: string;
  staffId?: string;
  userId?: string;
  notes?: string | null;
}

/** Request body for clock-out. Backend expects `id` (driver, staff, or user UUID). */
export interface ClockOutRequest {
  id?: string;
  driverId?: string;
  staffId?: string;
  userId?: string;
  notes?: string | null;
}

export interface PaginatedAttendanceResponse {
  data: AttendanceResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

export interface AttendanceMonitorStats {
  activeStaffCount: number;
  activeDriverCount: number;
  activeManagerCount: number;
}

export interface AttendanceSession {
  id: string;
  clockIn: string;
  clockOut: string | null;
  notes: string | null;
}

export interface AttendanceMonitorLog {
  id: string;
  personId: string;
  name: string;
  role: string;
  loginTime: string | null;
  clockInTime: string | null;
  clockOutTime: string | null;
  logoutTime: string | null;
  timeWorked: string | null;
  status: string;
  sessions?: AttendanceSession[];
}

export interface AttendanceMonitorResponse {
  stats: AttendanceMonitorStats;
  logs: AttendanceMonitorLog[];
}

export interface AttendanceStatusResponse {
  clockedIn: boolean;
  clockInTime: string | null;
  lastClockOutTime: string | null;
  status: string;
  attendanceId: string | null;
}

export async function getAttendanceStatus(userId: string): Promise<AttendanceStatusResponse> {
  const res = await api.get<AttendanceStatusResponse>(`/attendance/status/${userId}`);
  return res.data;
}

export async function getAttendanceMonitor(): Promise<AttendanceMonitorResponse> {
  const res = await api.get<AttendanceMonitorResponse>('/attendance/monitor');
  return res.data;
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
