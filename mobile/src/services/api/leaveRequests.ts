import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/endpints';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { type LeaveRequestStatus } from '../../constants/leaveRequests';

export type LeaveRequest = {
  id: string;
  driverId: string | null;
  staffId: string | null;
  userId: string | null;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: string;
  status: LeaveRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type GetLeaveRequestsResponse = {
  data: LeaveRequest[];
  pagination: PaginationMeta;
};

type GetLeaveRequestsParams = {
  page: number;
  limit: number;
  driverId?: string;
  status?: LeaveRequestStatus;
};

function normalizeId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

async function getStoredDriverId(): Promise<string> {
  const rawUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
  if (!rawUserData) {
    throw new Error('Missing driver id');
  }
  const parsed = JSON.parse(rawUserData) as { id?: string };
  const storedId = normalizeId(parsed?.id);
  if (!storedId) throw new Error('Missing driver id');
  return storedId;
}

export async function getLeaveRequestsApi(params: GetLeaveRequestsParams): Promise<GetLeaveRequestsResponse> {
  const driverId = normalizeId(params.driverId) ?? (await getStoredDriverId());

  const res = await apiClient.get<GetLeaveRequestsResponse>(API_ENDPOINTS.LEAVE.REQUESTS, {
    params: {
      page: params.page,
      limit: params.limit,
      driverId,
      ...(params.status ? { status: params.status } : {}),
    },
  });

  return res.data;
}

