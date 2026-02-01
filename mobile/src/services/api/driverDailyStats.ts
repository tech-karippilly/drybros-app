import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/endpints';
import { STORAGE_KEYS } from '../../constants/storageKeys';

export type DriverDailyStats = {
  driverId: string;
  date: string; // YYYY-MM-DD
  dailyTargetAmount: number;
  amountRunToday: number;
  tripsCountToday: number;
  incentiveToday: number;
  incentiveType: string | null;
  remainingToAchieve: number;
};

export type DriverDailyStatsResponse = {
  data: DriverDailyStats;
};

type GetDailyStatsParams = {
  driverId?: string;
  /** YYYY-MM-DD */
  date?: string;
};

function replacePathParam(pathTemplate: string, param: string): string {
  return pathTemplate.replace(':id', encodeURIComponent(param));
}

async function getStoredDriverId(): Promise<string | null> {
  const rawUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
  if (!rawUserData) return null;
  try {
    const parsed = JSON.parse(rawUserData) as { id?: string };
    return typeof parsed?.id === 'string' && parsed.id.trim().length ? parsed.id.trim() : null;
  } catch {
    return null;
  }
}

export async function getDriverDailyStatsApi(params?: GetDailyStatsParams): Promise<DriverDailyStats> {
  const driverId = params?.driverId ?? (await getStoredDriverId());
  if (!driverId) {
    throw new Error('Missing driver id. Please login again.');
  }

  const url = replacePathParam(API_ENDPOINTS.DRIVER.DAILY_STATS, driverId);
  const res = await apiClient.get<DriverDailyStatsResponse>(url, {
    params: params?.date ? { date: params.date } : undefined,
  });

  const payload = (res.data as any)?.data ?? res.data;
  return (payload?.data ?? payload) as DriverDailyStats;
}

