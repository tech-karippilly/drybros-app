/**
 * Complaints API – GET/POST /complaints, PATCH /complaints/:id/status
 * Resolve flow: status=RESOLVED requires action (WARNING|FIRE) and reason.
 */
import api from '../../axios';

export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type ComplaintResolutionAction = 'WARNING' | 'FIRE';

export interface ComplaintResponse {
  id: string;
  driverId: string | null;
  staffId: string | null;
  customerId: string | null;
  title: string;
  description: string;
  reportedBy: string | null;
  status: ComplaintStatus;
  severity: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolution: string | null;
  resolutionAction: ComplaintResolutionAction | null;
  resolutionReason: string | null;
}

export interface CreateComplaintRequest {
  driverId?: string;
  staffId?: string;
  customerId?: string;
  title: string;
  description: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/** When status is RESOLVED, action and reason are required. */
export interface UpdateComplaintStatusRequest {
  status: ComplaintStatus;
  resolution?: string | null;
  action?: ComplaintResolutionAction;
  reason?: string;
}

export interface PaginatedComplaintsResponse {
  data: ComplaintResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

export async function getComplaints(params?: {
  page?: number;
  limit?: number;
  driverId?: string;
  staffId?: string;
  status?: string;
}): Promise<ComplaintResponse[] | PaginatedComplaintsResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.driverId) search.set('driverId', params.driverId);
  if (params?.staffId) search.set('staffId', params.staffId);
  if (params?.status) search.set('status', params.status);
  const url = search.toString() ? `/complaints?${search.toString()}` : '/complaints';
  const res = await api.get<{ data: ComplaintResponse[] } | PaginatedComplaintsResponse>(url);
  const d = res.data;
  if ('pagination' in d) return d as PaginatedComplaintsResponse;
  return (d as { data: ComplaintResponse[] }).data;
}

export async function getComplaintById(id: string): Promise<ComplaintResponse> {
  const res = await api.get<{ data: ComplaintResponse }>(`/complaints/${id}`);
  return res.data.data;
}

export async function createComplaint(body: CreateComplaintRequest): Promise<ComplaintResponse> {
  const res = await api.post<{ data: ComplaintResponse }>('/complaints', body);
  return res.data.data;
}

export async function updateComplaintStatus(id: string, body: UpdateComplaintStatusRequest): Promise<ComplaintResponse> {
  const res = await api.patch<{ data: ComplaintResponse }>(`/complaints/${id}/status`, body);
  return res.data.data;
}
