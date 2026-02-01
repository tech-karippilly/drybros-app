import { apiClient } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../constants/endpints';
import { ATTENDANCE_ERRORS, type AttendanceStatus } from '../../constants/attendance';
import { STORAGE_KEYS } from '../../constants/storageKeys';

type ClockPersonRequest = {
  /** Backward compatible: provide `id` OR one of driverId/staffId/userId */
  id?: string;
  driverId?: string;
  staffId?: string;
  userId?: string;
};

export type ClockInRequest = ClockPersonRequest;

export type ClockOutRequest = ClockPersonRequest;

export type AttendanceEntry = {
  id: string;
  date: string;
  loginTime: string | null;
  clockIn: string | null;
  clockOut: string | null;
  status: AttendanceStatus;
  driverId?: string;
  staffId?: string;
  userId?: string;
};

export type ClockInResponse = {
  message: string;
  data: AttendanceEntry;
};

export type ClockOutResponse = {
  message: string;
  data: AttendanceEntry;
};

function normalizeId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function pickProvidedId(payload: ClockPersonRequest): {
  key: 'id' | 'driverId' | 'staffId' | 'userId';
  value: string;
} | null {
  const candidates = [
    { key: 'id' as const, value: normalizeId(payload.id) },
    { key: 'driverId' as const, value: normalizeId(payload.driverId) },
    { key: 'staffId' as const, value: normalizeId(payload.staffId) },
    { key: 'userId' as const, value: normalizeId(payload.userId) },
  ].filter((c) => Boolean(c.value)) as Array<{
    key: 'id' | 'driverId' | 'staffId' | 'userId';
    value: string;
  }>;

  if (candidates.length === 0) return null;
  if (candidates.length > 1) {
    throw new Error(ATTENDANCE_ERRORS.INVALID_CLOCK_PERSON_ID);
  }
  return candidates[0];
}

async function buildClockBody(payload?: ClockPersonRequest): Promise<ClockPersonRequest> {
  if (payload) {
    const selected = pickProvidedId(payload);
    if (!selected) throw new Error(ATTENDANCE_ERRORS.MISSING_CLOCK_PERSON_ID);
    return { [selected.key]: selected.value };
  }

  // Driver app default: use the logged-in driver id from storage
  const rawUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
  if (!rawUserData) throw new Error(ATTENDANCE_ERRORS.MISSING_CLOCK_PERSON_ID);

  try {
    const parsed = JSON.parse(rawUserData) as { id?: string };
    const storedId = normalizeId(parsed?.id);
    if (!storedId) throw new Error(ATTENDANCE_ERRORS.MISSING_CLOCK_PERSON_ID);
    // Backend supports id/driverId/staffId/userId; OpenAPI describes `id`.
    return { id: storedId };
  } catch {
    throw new Error(ATTENDANCE_ERRORS.MISSING_CLOCK_PERSON_ID);
  }
}

export async function clockInApi(payload?: ClockInRequest): Promise<ClockInResponse> {
  const body = await buildClockBody(payload);
  const res = await apiClient.post<ClockInResponse>(
    API_ENDPOINTS.ATTENDANCE.CLOCK_IN,
    body
  );
  return res.data;
}

export async function clockOutApi(payload?: ClockOutRequest): Promise<ClockOutResponse> {
  const body = await buildClockBody(payload);
  const res = await apiClient.post<ClockOutResponse>(
    API_ENDPOINTS.ATTENDANCE.CLOCK_OUT,
    body
  );
  return res.data;
}

export type AttendanceListResponse =
  | {
      data: AttendanceEntry[];
    }
  | {
      // Paginated shape (kept flexible; we only need `data`)
      data: AttendanceEntry[];
      pagination?: unknown;
    };

export type AttendanceListQuery = {
  driverId?: string;
  staffId?: string;
  userId?: string;
  /** ISO 8601 date-time */
  startDate?: string;
  /** ISO 8601 date-time */
  endDate?: string;
  page?: number;
  limit?: number;
};

export async function getAttendanceListApi(query?: AttendanceListQuery): Promise<AttendanceEntry[]> {
  // Driver app default: if caller didn't specify who, filter by stored driver id.
  const hasPersonFilter = Boolean(query?.driverId || query?.staffId || query?.userId);
  let effectiveQuery = query;

  if (!hasPersonFilter) {
    const rawUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (rawUserData) {
      try {
        const parsed = JSON.parse(rawUserData) as { id?: string };
        const storedId = normalizeId(parsed?.id);
        if (storedId) {
          effectiveQuery = { ...(query ?? {}), driverId: storedId };
        }
      } catch {
        // Ignore; fall back to original query.
      }
    }
  }

  const res = await apiClient.get<AttendanceListResponse>(API_ENDPOINTS.ATTENDANCE.LIST, {
    params: effectiveQuery,
  });
  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as AttendanceEntry[];
}