/**
 * Leave requests API – GET/POST /leave-requests, PATCH /leave-requests/:id/status
 */
import api from '../../axios';

export interface LeaveRequestResponse {
  id: string;
  driverId: string | null;
  staffId: string | null;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: string;
  status: string;
  requestedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequest {
  driverId?: string;
  staffId?: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: 'SICK_LEAVE' | 'CASUAL_LEAVE' | 'EARNED_LEAVE' | 'EMERGENCY_LEAVE' | 'OTHER';
}

export interface UpdateLeaveStatusRequest {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string | null;
}

export interface PaginatedLeaveResponse {
  data: LeaveRequestResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

export async function getLeaveRequests(params?: {
  page?: number;
  limit?: number;
  driverId?: string;
  staffId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<LeaveRequestResponse[] | PaginatedLeaveResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.driverId) search.set('driverId', params.driverId);
  if (params?.staffId) search.set('staffId', params.staffId);
  if (params?.status) search.set('status', params.status);
  if (params?.startDate) search.set('startDate', params.startDate);
  if (params?.endDate) search.set('endDate', params.endDate);
  const url = search.toString() ? `/leave-requests?${search.toString()}` : '/leave-requests';
  const res = await api.get<{ data: LeaveRequestResponse[] } | PaginatedLeaveResponse>(url);
  const d = res.data;
  if ('pagination' in d) return d as PaginatedLeaveResponse;
  return (d as { data: LeaveRequestResponse[] }).data;
}

export async function getLeaveRequestById(id: string): Promise<LeaveRequestResponse> {
  const res = await api.get<{ data: LeaveRequestResponse }>(`/leave-requests/${id}`);
  return res.data.data;
}

export async function createLeaveRequest(body: CreateLeaveRequest): Promise<LeaveRequestResponse> {
  const res = await api.post<{ data: LeaveRequestResponse }>('/leave-requests', body);
  return res.data.data;
}

export async function updateLeaveRequestStatus(id: string, body: UpdateLeaveStatusRequest): Promise<LeaveRequestResponse> {
  const res = await api.patch<{ data: LeaveRequestResponse }>(`/leave-requests/${id}/status`, body);
  return res.data.data;
}
